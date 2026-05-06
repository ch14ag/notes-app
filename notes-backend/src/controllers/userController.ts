import bcrypt from "bcrypt";
import type { Request, Response } from "express";
import type { Types } from "mongoose";
import jwt from "jsonwebtoken";

import ApiError from "../utils/apiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import User from "../models/userModel.js";
import ApiResponse from "../utils/apiResponse.js";

interface CookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "none" | "lax" | "strict";
}

const options: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
}

async function generateTokens(user: { _id: Types.ObjectId; email: string }) {
  const accessToken = jwt.sign(
    { _id: user._id, email: user.email },
    process.env.ACCESS_TOKEN_SECRET as string, { expiresIn: (process.env.ACCESS_TOKEN_EXPIRY as any) }
  );
  const refreshToken = jwt.sign(
    { _id: user._id, email: user.email },
    process.env.REFRESH_TOKEN_SECRET as string, { expiresIn: (process.env.REFRESH_TOKEN_EXPIRY as any) }
  );
  return { accessToken, refreshToken };
}

const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, username, password } = req.body as {
    name: string;
    email: string;
    username: string;
    password: string;
  };
  if ([name, email, username, password].some((field : string) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }
  const existingUser = await User.findOne({ $or: [{ email }, { username }] });
  if (existingUser) {
    throw new ApiError(409, "User with email or username already exists");
  }
  const user = new User({
    name,
    email,
    username: username.toLowerCase(),
    password,
  });
  await user.save();
  const createdUser = await User.findById(user._id).select("-password -refreshToken");
  if (!createdUser) {
    throw new ApiError(500, "User not created");
  }
  return res.status(201).json(new ApiResponse(201, "User registered successfully", createdUser));
});

const login = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as { email: string; password: string };
    if ([email, password].some((field : string) => field?.trim() === "")) {
      throw new ApiError(400, "All fields are required");
    }
    const user = await User.findOne({ email });
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      throw new ApiError(401, "Invalid credentials");
    }
    const { accessToken, refreshToken } = await generateTokens(user);
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(200, "Login successful", { user: loggedInUser, accessToken, refreshToken }));
  } catch (err) {
    throw new ApiError(500, "Login error");
  }
});

const logout = asyncHandler(async (req: Request, res: Response) => {
  await User.findByIdAndUpdate(req.user?._id, { $unset: { refreshToken: 1 } }, { returnDocument: "after" });
  return res.status(200)
  .clearCookie("accessToken", options)
  .clearCookie("refreshToken", options)
  .json(new ApiResponse(200, "User logged out successfully", {}));
});

const refreshAcessToken = asyncHandler(async (req: Request, res: Response) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
  console.log("Incoming refresh token:", incomingRefreshToken);
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Refresh token is required");
  }
  try {
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET as string) as jwt.JwtPayload;
    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "refresh token expired or already used");
    }
    const { accessToken, refreshToken } = await generateTokens(user);
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { $set: { refreshToken } },
      { returnDocument: "after" }
    ).select("-password -refreshToken");
    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(200, "Access token refreshed successfully", { accessToken, refreshToken, }));
  } catch (error) {
    throw new ApiError(401, error instanceof Error ? error.message : "Invalid refresh token");
  }
});

const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  return res.status(200)
  .json(new ApiResponse(200, "Current user fetched successfully", req.user || {}));
});

const newNote = asyncHandler(async (req: Request, res: Response) => {
  const { title, content } = req.body as { title: string; content: string };
  if (title.trim() === "") {
    throw new ApiError(400, "Title is required");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { $push: { notes: { title, content } } },
    { returnDocument: "after", runValidators: true }
  ).select("-password -refreshToken");
  return res.status(200).json(new ApiResponse(200, "Note added successfully", { notes: user?.notes }));
});

const getNotes = asyncHandler(async (req: Request, res: Response) => {
  return res.status(200)
  .json(new ApiResponse(200, "Notes fetched successfully", { notes: req.user?.notes, username: req.user?.username }));
});

const deleteNote = asyncHandler(async (req: Request, res: Response) => {
  const noteId = req.params.id;
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { $pull: { notes: { _id: noteId } } },
    { returnDocument: "after" }
  ).select("-password -refreshToken");
  return res.status(200)
  .json(new ApiResponse(200, "Note deleted successfully", { notes: user?.notes }));
});

export { register, login, logout, refreshAcessToken, getCurrentUser, newNote, getNotes, deleteNote };

import type { Request, Response, NextFunction} from "express";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";

declare global {
  namespace Express {
    interface Request {
      user?: InstanceType<typeof User>;
    }
  }
}

const verifyJwt = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const accessToken = req.cookies?.accessToken || req.headers.authorization?.replace("Bearer ", "");
    if (!accessToken) {
      throw new ApiError(401, "unauthorized request");
    }
    const decodedToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET as string) as jwt.JwtPayload;
    const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
    if (!user) {
      throw new ApiError(401, "invalid access token");
    }
    req.user = user;
    console.log("Authenticated user:", user.email);
    next();
  } catch (error) {
    throw new ApiError(401, error instanceof Error ? error.message : "invalid access token");
  }
});

export default verifyJwt;

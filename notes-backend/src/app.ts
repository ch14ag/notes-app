import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import ApiError from "./utils/apiError.js";
import userRouter from "./routes/userRoute.js";

const app = express();

app.use(express.json({ limit: "32kb" }));
app.use(express.urlencoded({ limit: "32kb", extended: true }));
app.use(express.static("public"));
app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:5173", credentials: true }));
app.use(cookieParser());

app.use("/api/v1/users", userRouter);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  let error = err;
  let statusCode = 500;
  let message = "Internal server error";

  // Handle ApiError instances
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // Handle Mongoose validation errors
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors).map((e: any) => e.message).join(", ");
  }

  // Handle Mongoose cast errors (invalid ObjectId)
  if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid resource ID";
  }

  // Handle duplicate key errors
  if (err.code === 11000) {
    statusCode = 400;
    message = "Resource already exists";
  }

  const response = {
    statusCode,
    success: false,
    message,
    errors: err.errors || [],
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  };

  return res.status(statusCode).json(response);
});

export default app;
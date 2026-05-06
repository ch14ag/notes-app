import type { NextFunction, Request, Response } from "express";

export default function asyncHandler(fn: Function): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((err) => next(err));
  };
};

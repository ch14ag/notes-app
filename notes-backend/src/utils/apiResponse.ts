import type { Document } from "mongoose";

export default class ApiResponse {
  statusCode: number;
  message: string;
  success: boolean;
  data: {};
  constructor(
    statusCode: number,
    message: string = "success",
    data: {},
  ) {
    this.statusCode = statusCode;
    this.message = message;
    this.success = statusCode < 400;
    this.data = data;
  }
}

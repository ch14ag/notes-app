export default class ApiError extends Error {
  statusCode: number;
  constructor(
    statusCode: number,
    message: string = "something went wrong",
    errors = [],
    stack: string = "",
  ) {
    super(message);
    this.statusCode = statusCode;
    if (stack) this.stack = stack;
    else Error.captureStackTrace(this, this.constructor);
  }
}

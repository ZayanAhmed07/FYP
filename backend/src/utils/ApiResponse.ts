export class ApiResponse<T> {
  constructor(
    public readonly success: boolean,
    public readonly statusCode: number,
    public readonly message: string,
    public readonly data?: T,
  ) {}

  static success<T>(statusCode: number, message: string, data?: T) {
    return new ApiResponse<T>(true, statusCode, message, data);
  }

  static error(statusCode: number, message: string, errors?: unknown) {
    return new ApiResponse(false, statusCode, message, errors);
  }
}






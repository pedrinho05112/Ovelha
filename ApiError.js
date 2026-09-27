class ApiError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true; // erro esperado/tratado, não um bug
  }
}

module.exports = ApiError;

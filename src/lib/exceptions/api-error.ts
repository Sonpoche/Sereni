export class ApiError extends Error {
    statusCode: number;
    code: string;
  
    constructor(message: string, statusCode: number, code: string) {
      super(message);
      this.statusCode = statusCode;
      this.code = code;
      this.name = 'ApiError';
    }
  
    static BadRequest(message = "Données invalides", code = "BAD_REQUEST") {
      return new ApiError(message, 400, code);
    }
  
    static Unauthorized(message = "Non autorisé", code = "UNAUTHORIZED") {
      return new ApiError(message, 401, code);
    }
  
    static Forbidden(message = "Accès interdit", code = "FORBIDDEN") {
      return new ApiError(message, 403, code);
    }
  
    static NotFound(message = "Non trouvé", code = "NOT_FOUND") {
      return new ApiError(message, 404, code);
    }
  
    static InternalServer(message = "Erreur interne du serveur", code = "INTERNAL_SERVER_ERROR") {
      return new ApiError(message, 500, code);
    }
  }
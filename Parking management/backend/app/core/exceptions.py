from fastapi import HTTPException, status


class AppError(HTTPException):
    def __init__(self, error_code: str, message: str, status_code: int = status.HTTP_400_BAD_REQUEST):
        super().__init__(status_code=status_code, detail={"error": error_code, "message": message})


def not_found(resource: str) -> AppError:
    return AppError("NOT_FOUND", f"{resource} not found.", status.HTTP_404_NOT_FOUND)


def forbidden(message: str = "Access denied.") -> AppError:
    return AppError("ACCESS_DENIED", message, status.HTTP_403_FORBIDDEN)


def unauthorized(message: str = "Invalid credentials.") -> AppError:
    return AppError("UNAUTHORIZED", message, status.HTTP_401_UNAUTHORIZED)

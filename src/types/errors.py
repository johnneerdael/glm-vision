"""
Custom error types for Z.AI MCP Vision Server
"""

from typing import Optional, Dict, Any


class VisionServerError(Exception):
    """Base exception for all vision server errors."""

    def __init__(
        self,
        message: str,
        error_code: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(message)
        self.message = message
        self.error_code = error_code
        self.details = details or {}


class FileNotFoundError(VisionServerError):
    """Raised when a requested file cannot be found."""

    def __init__(self, message: str, file_path: Optional[str] = None):
        super().__init__(message, "FILE_NOT_FOUND", {"file_path": file_path})
        self.file_path = file_path


class ValidationError(VisionServerError):
    """Raised when input validation fails."""

    def __init__(
        self,
        message: str,
        field: Optional[str] = None,
        value: Optional[Any] = None
    ):
        super().__init__(message, "VALIDATION_ERROR", {"field": field, "value": value})
        self.field = field
        self.value = value


class NetworkError(VisionServerError):
    """Raised when network operations fail."""

    def __init__(
        self,
        message: str,
        url: Optional[str] = None,
        status_code: Optional[int] = None
    ):
        super().__init__(
            message,
            "NETWORK_ERROR",
            {"url": url, "status_code": status_code}
        )
        self.url = url
        self.status_code = status_code


class ApiError(VisionServerError):
    """Raised when API calls fail."""

    def __init__(
        self,
        message: str,
        api_response: Optional[Dict[str, Any]] = None,
        status_code: Optional[int] = None
    ):
        super().__init__(
            message,
            "API_ERROR",
            {"api_response": api_response, "status_code": status_code}
        )
        self.api_response = api_response
        self.status_code = status_code


class ConfigurationError(VisionServerError):
    """Raised when configuration is invalid."""

    def __init__(
        self,
        message: str,
        config_key: Optional[str] = None,
        config_value: Optional[Any] = None
    ):
        super().__init__(
            message,
            "CONFIGURATION_ERROR",
            {"config_key": config_key, "config_value": config_value}
        )
        self.config_key = config_key
        self.config_value = config_value
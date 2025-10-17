"""
Configuration management for Z.AI MCP Vision Server
"""

import os
from functools import lru_cache
from typing import Optional, Literal
from pydantic import BaseSettings, Field


class Settings(BaseSettings):
    """Application settings with environment variable support."""

    # Server Configuration
    server_name: str = Field(default="zai-mcp-server", env="SERVER_NAME")
    server_version: str = Field(default="2.0.0", env="SERVER_VERSION")
    transport: Literal["stdio", "http"] = Field(default="stdio", env="TRANSPORT")
    host: str = Field(default="0.0.0.0", env="HOST")
    port: int = Field(default=8000, env="PORT")
    debug: bool = Field(default=False, env="DEBUG")
    log_level: str = Field(default="INFO", env="LOG_LEVEL")

    # API Configuration
    api_key: Optional[str] = Field(default=None, env="Z_AI_API_KEY")
    base_url: str = Field(
        default="https://open.bigmodel.cn/api/paas/v4/",
        env="Z_AI_BASE_URL"
    )

    # Platform Configuration
    platform_mode: Literal["ZAI", "ZHIPU", "AUTO"] = Field(default="AUTO", env="PLATFORM_MODE")

    # Model Configuration
    vision_model: str = Field(default="glm-4.5v", env="VISION_MODEL")
    temperature: float = Field(default=0.8, ge=0.0, le=2.0, env="TEMPERATURE")
    top_p: float = Field(default=0.6, ge=0.0, le=1.0, env="TOP_P")
    max_tokens: int = Field(default=16384, ge=1, le=32768, env="MAX_TOKENS")

    # Request Configuration
    timeout_seconds: int = Field(default=300, ge=1, le=3600, env="TIMEOUT_SECONDS")
    retry_count: int = Field(default=2, ge=0, le=5, env="RETRY_COUNT")
    retry_delay_seconds: float = Field(default=1.0, ge=0.1, le=60.0, env="RETRY_DELAY_SECONDS")

    # File Size Limits
    max_image_size_mb: int = Field(default=5, ge=1, le=100, env="MAX_IMAGE_SIZE_MB")
    max_video_size_mb: int = Field(default=8, ge=1, le=500, env="MAX_VIDEO_SIZE_MB")

    # Rate Limiting
    rate_limit: int = Field(default=50, ge=1, le=1000, env="RATE_LIMIT")

    # FastMCP Configuration
    fastmcp_settings: dict = Field(default_factory=dict)

    class Config:
        env_file = ".env"
        case_sensitive = False

    def __post_init__(self):
        """Post-initialization configuration."""
        # Detect platform if auto
        if self.platform_mode == "AUTO":
            self.platform_mode = self._detect_platform()

        # Adjust base URL based on platform
        if self.platform_mode == "ZAI":
            self.base_url = "https://api.z.ai/api/paas/v4/"
        elif self.platform_mode == "ZHIPU":
            self.base_url = "https://open.bigmodel.cn/api/paas/v4/"

        # Validate API key
        if not self.api_key:
            raise ValueError("Z_AI_API_KEY environment variable is required")

        # Configure FastMCP settings
        self.fastmcp_settings = {
            "log_level": self.log_level,
            "timeout": self.timeout_seconds,
            "max_concurrent_requests": self.rate_limit
        }

    def _detect_platform(self) -> str:
        """Auto-detect platform based on API key patterns."""
        if not self.api_key:
            return "ZHIPU"  # Default

        # Simple heuristic based on key patterns
        if "zhipu" in self.api_key.lower() or "glm" in self.api_key.lower():
            return "ZHIPU"
        else:
            return "ZAI"

    @property
    def api_endpoint(self) -> str:
        """Get the full API endpoint URL."""
        return f"{self.base_url.rstrip('/')}/chat/completions"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
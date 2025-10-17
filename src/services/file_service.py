"""
File operations service for handling image and video files
"""

import os
import mimetypes
import asyncio
from pathlib import Path
from typing import Union, Tuple, Optional
from urllib.parse import urlparse
import aiofiles
import httpx

from src.types.errors import FileNotFoundError, ValidationError, NetworkError
from src.config.settings import get_settings


class FileService:
    """Service for file operations including validation, encoding, and URL handling."""

    def __init__(self):
        self.settings = get_settings()
        self.supported_image_formats = {'.png', '.jpg', '.jpeg'}
        self.supported_video_formats = {'.mp4', '.mov', '.avi', '.webm', '.m4v'}

    def is_url(self, source: str) -> bool:
        """Check if a string is a valid URL."""
        try:
            result = urlparse(source)
            return result.scheme in ('http', 'https') and result.netloc
        except Exception:
            return False

    async def validate_image_source(self, image_source: str) -> None:
        """Validate image source (file or URL) and check size limit."""
        if self.is_url(image_source):
            await self._validate_image_url(image_source)
        else:
            await self._validate_image_file(image_source)

    async def validate_video_source(self, video_source: str) -> None:
        """Validate video source (file or URL) and check size limit."""
        if self.is_url(video_source):
            await self._validate_video_url(video_source)
        else:
            await self._validate_video_file(video_source)

    async def _validate_image_file(self, file_path: str) -> None:
        """Validate local image file."""
        path = Path(file_path)

        if not path.exists():
            raise FileNotFoundError(f"Image file not found: {file_path}")

        if not path.is_file():
            raise ValidationError(f"Path is not a file: {file_path}")

        # Check file size
        size_mb = path.stat().st_size / (1024 * 1024)
        if size_mb > self.settings.max_image_size_mb:
            raise ValidationError(
                f"Image file too large: {size_mb:.2f}MB. "
                f"Maximum allowed: {self.settings.max_image_size_mb}MB"
            )

        # Check file format
        if path.suffix.lower() not in self.supported_image_formats:
            raise ValidationError(
                f"Unsupported image format: {path.suffix}. "
                f"Supported formats: {', '.join(self.supported_image_formats)}"
            )

    async def _validate_video_file(self, file_path: str) -> None:
        """Validate local video file."""
        path = Path(file_path)

        if not path.exists():
            raise FileNotFoundError(f"Video file not found: {file_path}")

        if not path.is_file():
            raise ValidationError(f"Path is not a file: {file_path}")

        # Check file size
        size_mb = path.stat().st_size / (1024 * 1024)
        if size_mb > self.settings.max_video_size_mb:
            raise ValidationError(
                f"Video file too large: {size_mb:.2f}MB. "
                f"Maximum allowed: {self.settings.max_video_size_mb}MB"
            )

        # Check file format
        if path.suffix.lower() not in self.supported_video_formats:
            raise ValidationError(
                f"Unsupported video format: {path.suffix}. "
                f"Supported formats: {', '.join(self.supported_video_formats)}"
            )

    async def _validate_image_url(self, url: str) -> None:
        """Validate image URL accessibility."""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.head(url)
                response.raise_for_status()

                # Check content type
                content_type = response.headers.get('content-type', '').lower()
                if not content_type.startswith('image/'):
                    raise ValidationError(f"URL does not point to an image: {content_type}")

        except httpx.HTTPError as e:
            raise NetworkError(f"Cannot access image URL: {e}")
        except Exception as e:
            raise NetworkError(f"Network error validating image URL: {e}")

    async def _validate_video_url(self, url: str) -> None:
        """Validate video URL accessibility."""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.head(url)
                response.raise_for_status()

                # Check content type
                content_type = response.headers.get('content-type', '').lower()
                if not content_type.startswith('video/'):
                    raise ValidationError(f"URL does not point to a video: {content_type}")

        except httpx.HTTPError as e:
            raise NetworkError(f"Cannot access video URL: {e}")
        except Exception as e:
            raise NetworkError(f"Network error validating video URL: {e}")

    async def encode_image_to_base64(self, image_source: str) -> str:
        """Encode image to base64 data URL."""
        if self.is_url(image_source):
            # For URLs, return the URL directly
            return image_source

        # For local files, encode to base64
        path = Path(image_source)
        await self._validate_image_file(image_source)

        async with aiofiles.open(path, 'rb') as f:
            image_data = await f.read()

        # Get MIME type
        mime_type = self._get_mime_type(path.suffix)

        # Encode to base64
        import base64
        base64_data = base64.b64encode(image_data).decode('utf-8')

        return f"data:{mime_type};base64,{base64_data}"

    async def encode_video_to_base64(self, video_source: str) -> str:
        """Encode video to base64 data URL."""
        if self.is_url(video_source):
            # For URLs, return the URL directly
            return video_source

        # For local files, encode to base64
        path = Path(video_source)
        await self._validate_video_file(video_source)

        async with aiofiles.open(path, 'rb') as f:
            video_data = await f.read()

        # Get MIME type
        mime_type = self._get_mime_type(path.suffix, is_video=True)

        # Encode to base64
        import base64
        base64_data = base64.b64encode(video_data).decode('utf-8')

        return f"data:{mime_type};base64,{base64_data}"

    def _get_mime_type(self, extension: str, is_video: bool = False) -> str:
        """Get MIME type for file extension."""
        extension = extension.lower()

        if is_video:
            mime_types = {
                '.mp4': 'video/mp4',
                '.avi': 'video/x-msvideo',
                '.mov': 'video/quicktime',
                '.webm': 'video/webm',
                '.m4v': 'video/x-m4v'
            }
        else:
            mime_types = {
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg'
            }

        return mime_types.get(extension, 'image/png' if not is_video else 'video/mp4')

    async def get_file_info(self, file_source: str) -> dict:
        """Get file information including size, format, and type."""
        if self.is_url(file_source):
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    response = await client.head(file_source)
                    response.raise_for_status()

                    return {
                        "source": file_source,
                        "type": "url",
                        "size": None,  # Size not available from HEAD request
                        "content_type": response.headers.get('content-type'),
                        "accessible": True
                    }
            except Exception as e:
                return {
                    "source": file_source,
                    "type": "url",
                    "size": None,
                    "content_type": None,
                    "accessible": False,
                    "error": str(e)
                }
        else:
            path = Path(file_source)
            if not path.exists():
                return {
                    "source": file_source,
                    "type": "file",
                    "size": None,
                    "content_type": None,
                    "accessible": False,
                    "error": "File not found"
                }

            stat = path.stat()
            mime_type = self._get_mime_type(path.suffix, path.suffix in self.supported_video_formats)

            return {
                "source": file_source,
                "type": "file",
                "size": stat.st_size,
                "size_mb": stat.st_size / (1024 * 1024),
                "content_type": mime_type,
                "accessible": True,
                "extension": path.suffix
            }
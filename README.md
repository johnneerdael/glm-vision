# Z.AI MCP Vision Analysis Server - Python Implementation

A Model Context Protocol (MCP) server for AI-powered vision analysis using the Z.AI platform. This is the Python implementation using the FastMCP framework.

## Overview

This MCP server provides AI vision analysis capabilities through two main tools:
- **Image Analysis**: Analyze images using advanced AI vision models
- **Video Analysis**: Analyze videos using advanced AI vision models

The server supports both local files and remote URLs, with automatic base64 encoding for local files.

## Features

- ✅ **Python Implementation**: Modern Python codebase using FastMCP framework
- ✅ **Multi-Platform Support**: Z.AI and Zhipu AI platforms with auto-detection
- ✅ **File Support**: Local files and remote URLs with validation
- ✅ **Type Safety**: Full type annotations with Pydantic validation
- ✅ **Async Operations**: Non-blocking file and API operations
- ✅ **Error Handling**: Comprehensive error handling with detailed messages
- ✅ **Configuration**: Environment-based configuration management
- ✅ **Docker Ready**: Container deployment support

## Quick Start

### Prerequisites

- Python 3.10 or higher
- Z.AI API key

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd glm_vision
   ```

2. **Set up environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your API key
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements/prod.txt
   ```

4. **Run the server**:
   ```bash
   python -m src.vision_server
   ```

### Docker Deployment

```bash
docker build -t zai-mcp-vision-server .
docker run -e Z_AI_API_KEY=your_api_key zai-mcp-vision-server
```

## Configuration

The server is configured through environment variables. See `.env.example` for all available options:

### Required
- `Z_AI_API_KEY`: Your Z.AI API key

### Optional
- `PLATFORM_MODE`: Platform mode (ZAI, ZHIPU, AUTO)
- `VISION_MODEL`: Vision model to use (default: glm-4.5v)
- `MAX_IMAGE_SIZE_MB`: Maximum image size in MB (default: 5)
- `MAX_VIDEO_SIZE_MB`: Maximum video size in MB (default: 8)
- `TRANSPORT`: Transport mode (stdio, http)
- `LOG_LEVEL`: Logging level (DEBUG, INFO, WARNING, ERROR)

## Usage

### MCP Tools

The server registers the following MCP tools:

#### `analyze_image`
Analyze an image using AI vision models.

**Parameters:**
- `image_source` (string): Local file path or remote URL to the image
- `prompt` (string): Detailed analysis prompt

**Example:**
```python
{
    "image_source": "/path/to/image.jpg",
    "prompt": "Describe what you see in this image"
}
```

#### `analyze_video`
Analyze a video using AI vision models.

**Parameters:**
- `video_source` (string): Local file path or remote URL to the video
- `prompt` (string): Detailed analysis prompt

**Example:**
```python
{
    "video_source": "https://example.com/video.mp4",
    "prompt": "Summarize the content of this video"
}
```

### Supported Formats

**Images:** PNG, JPG, JPEG (max 5MB)
**Videos:** MP4, MOV, AVI, WebM, M4V (max 8MB)

## Development

### Setup Development Environment

```bash
# Install development dependencies
pip install -r requirements/dev.txt

# Run tests
pytest

# Code formatting
black src/ tests/
ruff check src/ tests/

# Type checking
mypy src/
```

### Project Structure

```
src/
├── vision_server.py          # Main FastMCP server
├── config/
│   ├── settings.py           # Configuration management
├── services/
│   ├── file_service.py       # File operations
├── types/
│   ├── errors.py             # Custom error types
└── utils/                     # Utility functions
```

## Migration from TypeScript

This is the Python implementation of the original TypeScript MCP server. The migration maintains:

- ✅ **API Compatibility**: Same tool names and parameters
- ✅ **Functionality**: All existing features preserved
- ✅ **Configuration**: Compatible environment variables
- ✅ **Error Responses**: Consistent error handling

## License

Apache License 2.0 - see LICENSE file for details.

## Support

- **Documentation**: https://docs.z.ai/
- **Issues**: https://github.com/z-ai/mcp-vision-server/issues
- **Support**: support@z.ai

## Changelog

### v2.0.0 (Python Implementation)
- ✅ Complete migration from TypeScript to Python
- ✅ FastMCP framework integration
- ✅ Enhanced error handling and validation
- ✅ Improved configuration management
- ✅ Docker containerization support
- ✅ Comprehensive type safety
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an MCP (Model Context Protocol) server that provides AI vision capabilities for the Z.AI/Zhipu AI platform. It's a Node.js CLI tool that implements vision analysis tools for images and videos.

## Common Development Commands

### Build and Development
- `npm run build` - Compile TypeScript to JavaScript and set executable permissions
- `npm run start` - Run the compiled MCP server
- `npm run prepare` - Build before package installation

### Publishing
- `npm run prerelease` - Create pre-release version with beta tag
- `npm run publish-beta` - Publish to npm with beta tag
- `npm run publish` - Publish to npm registry

The main entry point is `build/index.js` which gets created after building.

## Architecture

### Core Components

**McpServerApplication** (`build/index.js`): Main server class that manages MCP lifecycle, tool registration, and error handling.

**Service Layer**:
- `core/environment.js` - Configuration management with platform auto-detection
- `core/chat-service.js` - Z.AI API integration with authentication and retry logic
- `core/file-service.js` - File operations and validation
- `core/error-handler.js` - Comprehensive error handling with multiple strategies

**Tools**:
- `tools/image-analysis.js` - Image analysis (PNG, JPG, max 5MB)
- `tools/video-analysis.js` - Video analysis (MP4, MOV, AVI, max 8MB)

**Types and Utilities**:
- `types/index.js` - Custom error types
- `types/validation-types.js` - Validation schemas
- `utils/logger.js` - Logging system (redirects console to avoid MCP protocol interference)
- `utils/validation.js` - Schema builders and validators

### Platform Support

The server supports two platforms with auto-detection:
- **Z.AI**: `https://api.z.ai/api/paas/v4/`
- **Zhipu AI**: `https://open.bigmodel.cn/api/paas/v4/`

Platform detection is based on environment variables (`Z_AI_API_KEY`, `ZAI_API_KEY`, `ANTHROPIC_AUTH_TOKEN`).

### Error Handling Architecture

The project uses a sophisticated error management system:
- Hierarchical error classes (BaseError → BusinessError/SystemError/NetworkError/ToolExecutionError)
- Strategy pattern for different error handling approaches
- Automatic retry with exponential backoff
- Severity levels (LOW, MEDIUM, HIGH, CRITICAL)
- Error categories (VALIDATION, AUTHENTICATION, NETWORK, API, SYSTEM, BUSINESS)

### Key Patterns

- **Singleton Pattern** for services (EnvironmentService, ErrorHandler)
- **Factory Pattern** for tool registration
- **Strategy Pattern** for error handling and recovery
- **Service-Oriented Architecture** with clear separation of concerns

## Environment Configuration

Required environment variables:
- `Z_AI_API_KEY` or `ZAI_API_KEY` or `ANTHROPIC_AUTH_TOKEN` - API authentication

Optional configuration:
- `PLATFORM_MODE` - Force platform (Z_AI, ZHIPU_AI)
- `Z_AI_BASE_URL` - Custom API base URL
- Model parameters: temperature, top_p, max_tokens, timeout
- Server metadata: SERVER_NAME, SERVER_VERSION

## Tool Registration

The server registers two main tools:
- `analyze_image` - AI-powered image analysis
- `analyze_video` - AI-powered video analysis

Both tools support local files (with automatic base64 encoding) and remote URLs.
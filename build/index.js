#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { configurationService } from './core/environment.js';
import { handleError } from './core/error-handler.js';
import { setupConsoleRedirection } from './utils/logger.js';
// Setup console redirection BEFORE any other code to prevent stdout pollution
setupConsoleRedirection();
// Import tool registration functions
import { registerImageAnalysisTool } from './tools/image-analysis.js';
import { registerVideoAnalysisTool } from './tools/video-analysis.js';
import { McpError } from "./types/index.js";
/**
 * MCP Server Application class
 */
class McpServerApplication {
    server;
    constructor() {
        this.server = new McpServer({
            name: configurationService.getServerConfig().name,
            version: configurationService.getServerConfig().version
        }, {
            capabilities: {
                tools: {}
            }
        });
        this.setupErrorHandling();
        console.info('MCP Server Application initialized');
    }
    /**
     * Register all tools
     */
    async registerTools() {
        try {
            // Register tools directly with server
            registerImageAnalysisTool(this.server);
            registerVideoAnalysisTool(this.server);
            console.info('Successfully registered all tools');
        }
        catch (error) {
            const standardError = await handleError(error, {
                operation: 'tool-registration',
                metadata: { component: 'McpServerApplication' }
            });
            console.error('Failed to register tools', standardError);
            throw standardError;
        }
    }
    /**
     * Setup error handling
     */
    setupErrorHandling() {
        process.on('uncaughtException', (error) => {
            console.error('Uncaught exception:', error);
            this.gracefulShutdown(1);
        });
        process.on('unhandledRejection', (reason, promise) => {
            console.error('Unhandled rejection at:', { promise, reason });
            this.gracefulShutdown(1);
        });
        process.on('SIGINT', () => {
            console.info('Received SIGINT, shutting down gracefully...');
            this.gracefulShutdown(0);
        });
        process.on('SIGTERM', () => {
            console.info('Received SIGTERM, shutting down gracefully...');
            this.gracefulShutdown(0);
        });
    }
    /**
     * Graceful shutdown
     */
    gracefulShutdown(exitCode) {
        try {
            console.info('Performing graceful shutdown...');
            // Cleanup logic can be added here
            process.exit(exitCode);
        }
        catch (error) {
            console.error('Error during graceful shutdown:', { error });
            process.exit(1);
        }
    }
    /**
     * Start server
     */
    async start() {
        try {
            console.info('Starting MCP server...');
            // Set up global error handling
            process.on('uncaughtException', async (error) => {
                const standardError = await handleError(error, {
                    operation: 'uncaughtException',
                    metadata: { source: 'process' }
                });
                console.error('Uncaught exception:', standardError);
                process.exit(1);
            });
            process.on('unhandledRejection', async (reason) => {
                const error = reason instanceof Error ? reason : new Error(String(reason));
                const standardError = await handleError(error, {
                    operation: 'unhandledRejection',
                    metadata: { source: 'process' }
                });
                console.error('Unhandled Promise rejection:', standardError);
                process.exit(1);
            });
            // Register tools
            await this.registerTools();
            // Create transport layer
            const transport = new StdioServerTransport();
            // Start server
            await this.server.connect(transport);
            console.info('MCP Server started successfully', {
                mode: configurationService.getPlatformModel(),
                name: configurationService.getServerConfig().name,
                version: configurationService.getServerConfig().version
            });
        }
        catch (error) {
            const standardError = await handleError(error, {
                operation: 'server-start',
                metadata: { component: 'McpServerApplication' }
            });
            console.error('Server startup failed:', standardError);
            throw standardError;
        }
    }
    /**
     * Gracefully shutdown server
     */
    async shutdown() {
        try {
            console.info('Shutting down MCP server...');
            console.info('MCP server shutdown completed');
        }
        catch (error) {
            console.error('Error during server shutdown', { error });
            throw error;
        }
    }
}
// Start application
async function main() {
    try {
        const app = new McpServerApplication();
        await app.start();
    }
    catch (error) {
        if (error instanceof McpError) {
            console.error('Application startup failed:', { message: error.message });
        }
        else {
            console.error('Application startup failed:', { error });
        }
        process.exit(1);
    }
}
// Start main program
main();

import { ApiError } from '../types/index.js';
/**
 * Environment configuration service using singleton pattern
 */
export class EnvironmentService {
    static instance;
    config = null;
    constructor() { }
    /**
     * Get singleton instance of EnvironmentService
     */
    static getInstance() {
        if (!EnvironmentService.instance) {
            EnvironmentService.instance = new EnvironmentService();
        }
        return EnvironmentService.instance;
    }
    /**
     * Get environment configuration
     */
    getConfig() {
        if (!this.config) {
            this.config = this.loadEnvironmentConfig();
        }
        return this.config;
    }
    /**
     * Load environment configuration from process.env
     */
    loadEnvironmentConfig() {
        const envConfig = { ...process.env };
        if (!envConfig.Z_AI_BASE_URL) {
            // for z.ai paas is https://api.z.ai/api/paas/v4/
            // for zhipuai is https://open.bigmodel.cn/api/paas/v4/
            envConfig.Z_AI_BASE_URL = 'https://open.bigmodel.cn/api/paas/v4/';
        }
        if (envConfig.PLATFORM_MODE != null) {
            console.info('Running in mode', { mode: envConfig.PLATFORM_MODE });
            if (envConfig.PLATFORM_MODE === 'Z_AI' || envConfig.PLATFORM_MODE === 'ZAI' || envConfig.PLATFORM_MODE === 'Z') {
                envConfig.Z_AI_BASE_URL = 'https://api.z.ai/api/paas/v4/';
                envConfig.PLATFORM_MODE = 'ZAI';
            }
            else if (envConfig.PLATFORM_MODE === 'ZHIPU_AI' || envConfig.PLATFORM_MODE === 'ZHIPUAI'
                || envConfig.PLATFORM_MODE === 'ZHIPU' || envConfig.PLATFORM_MODE === 'BIGMODEL') {
                envConfig.Z_AI_BASE_URL = 'https://open.bigmodel.cn/api/paas/v4/';
                envConfig.PLATFORM_MODE = 'ZHIPU';
            }
        }
        else {
            envConfig.PLATFORM_MODE = 'ZHIPU';
        }
        if (!envConfig.Z_AI_API_KEY && envConfig.ZAI_API_KEY) {
            envConfig.Z_AI_API_KEY = envConfig.ZAI_API_KEY;
            console.warn("[important] Z_AI_API_KEY is not set but found ZAI_API_KEY, using ZAI_API_KEY as Z_AI_API_KEY");
        }
        // for some user forget replace the `your_api_key` `your_zhipu_api_key` `your_zai_api_key` in the env
        if (!envConfig.Z_AI_API_KEY || envConfig.Z_AI_API_KEY?.toLowerCase().includes('api')
            || envConfig.Z_AI_API_KEY?.toLowerCase().includes('key')) {
            if (envConfig.ANTHROPIC_AUTH_TOKEN && !envConfig.ANTHROPIC_AUTH_TOKEN?.toLowerCase().includes('api')) {
                // use the ANTHROPIC_AUTH_TOKEN as Z_AI_API_KEY if available
                envConfig.Z_AI_API_KEY = envConfig.ANTHROPIC_AUTH_TOKEN;
                console.warn('[important] Z_AI_API_KEY is not set but found ANTHROPIC_AUTH_TOKEN, using ANTHROPIC_AUTH_TOKEN as Z_AI_API_KEY');
            }
            else {
                throw new ApiError('Z_AI_API_KEY environment variable is required, please set your actual API key');
            }
        }
        return {
            Z_AI_BASE_URL: envConfig.Z_AI_BASE_URL,
            Z_AI_API_KEY: envConfig.Z_AI_API_KEY,
            Z_AI_VISION_MODEL: envConfig.Z_AI_VISION_MODEL,
            Z_AI_VISION_MODEL_TEMPERATURE: envConfig.Z_AI_VISION_MODEL_TEMPERATURE,
            Z_AI_VISION_MODEL_TOP_P: envConfig.Z_AI_VISION_MODEL_TOP_P,
            Z_AI_VISION_MODEL_MAX_TOKENS: envConfig.Z_AI_VISION_MODEL_MAX_TOKENS,
            Z_AI_TIMEOUT: envConfig.Z_AI_TIMEOUT,
            Z_AI_RETRY_COUNT: envConfig.Z_AI_RETRY_COUNT,
            SERVER_NAME: envConfig.SERVER_NAME,
            SERVER_VERSION: envConfig.SERVER_VERSION,
            PLATFORM_MODE: envConfig.PLATFORM_MODE
        };
    }
    /**
     * Get server configuration
     */
    getServerConfig() {
        const config = this.getConfig();
        return {
            name: config.SERVER_NAME || 'zai-mcp-server',
            version: config.SERVER_VERSION || '0.1.0'
        };
    }
    /**
     * Get platform mode
     */
    getPlatformModel() {
        const config = this.getConfig();
        return config.PLATFORM_MODE || 'ZHIPU';
    }
    /**
     * Get API configuration
     */
    getVisionConfig() {
        const config = this.getConfig();
        return {
            model: config.Z_AI_VISION_MODEL || 'glm-4.5v',
            timeout: parseInt(config.Z_AI_TIMEOUT || '300000'),
            retryCount: parseInt(config.Z_AI_RETRY_COUNT || '1'),
            url: config.Z_AI_BASE_URL + 'chat/completions',
            temperature: parseFloat(config.Z_AI_VISION_MODEL_TEMPERATURE || '0.8'),
            topP: parseFloat(config.Z_AI_VISION_MODEL_TOP_P || '0.6'),
            maxTokens: parseInt(config.Z_AI_VISION_MODEL_MAX_TOKENS || '16384')
        };
    }
    /**
     * Get ZAI API key from configuration
     */
    getApiKey() {
        return this.getConfig().Z_AI_API_KEY;
    }
}
/**
 * Global environment service instance
 */
export const environmentService = EnvironmentService.getInstance();
/**
 * Configuration service instance (for backward compatibility)
 */
export const configurationService = environmentService;
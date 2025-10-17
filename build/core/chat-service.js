import { ApiError } from '../types/index.js';
import { configurationService } from './environment.js';
import { EnvironmentService } from './environment.js';
/**
 * ZAI API service implementation
 */
export class ChatService {
    environmentService;
    constructor(environmentService = EnvironmentService.getInstance()) {
        this.environmentService = environmentService;
    }
    /**
     * ZAI chat completions API for vision analysis
     */
    async visionCompletions(messages) {
        const visionConfig = configurationService.getVisionConfig();
        const requestBody = {
            model: visionConfig.model,
            messages,
            thinking: { type: 'enabled' },
            stream: false,
            temperature: visionConfig.temperature,
            top_p: visionConfig.topP,
            max_tokens: visionConfig.maxTokens
        };
        console.info('Request ZAI chat completions API for vision analysis', { model: visionConfig.model, messageCount: messages.length });
        try {
            const response = await this.chatCompletions(visionConfig.url, requestBody);
            const result = response.choices?.[0]?.message?.content;
            if (!result) {
                throw new ApiError('Invalid API response: missing content');
            }
            console.info('Request chat completions API for vision analysis successful');
            return result;
        }
        catch (error) {
            console.error('Request chat completions API for vision analysis failed', { error: error instanceof Error ? error.message : String(error) });
            throw error instanceof ApiError ? error : new ApiError(`API call failed: ${error}`);
        }
    }
    /**
     * Make HTTP request to ZAI API with proper headers and error handling
     */
    async chatCompletions(url, body) {
        const apiConfig = configurationService.getVisionConfig();
        const apiKey = this.environmentService.getApiKey();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), apiConfig.timeout);
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'X-Title': '4.5V MCP Local',
                    'Accept-Language': 'en-US,en'
                },
                body: JSON.stringify(body),
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (!response.ok) {
                const errorText = await response.text();
                throw new ApiError(`HTTP ${response.status}: ${errorText}`);
            }
            return await response.json();
        }
        catch (error) {
            clearTimeout(timeoutId);
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError(`Network error: ${error}`);
        }
    }
}
/**
 * ZAI API chat completions service instance
 */
export const chatService = new ChatService();

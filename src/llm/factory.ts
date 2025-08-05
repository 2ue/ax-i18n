import { BaseLanguageModel } from '@langchain/core/language_models/base';
import { ChatOllama } from '@langchain/community/chat_models/ollama';
import type { LLMConfig } from '../config/types.js';

/**
 * LLM 提供者工厂
 */
export class LLMProviderFactory {
  /**
   * 创建 LLM 实例
   */
  static createLLM(config: LLMConfig): BaseLanguageModel {
    switch (config.provider) {
      case 'openai': {
        const ChatOpenAI = require('@langchain/openai').ChatOpenAI;
        return new ChatOpenAI({
          apiKey: config.apiKey || '',
          model: config.model,
          temperature: config.temperature,
          maxTokens: config.maxTokens,
          maxRetries: config.retryCount,
        });
      }

      case 'anthropic': {
        const ChatAnthropic = require('@langchain/anthropic').ChatAnthropic;
        return new ChatAnthropic({
          apiKey: config.apiKey || '',
          model: config.model,
          temperature: config.temperature,
          maxTokens: config.maxTokens,
          maxRetries: config.retryCount,
        });
      }

      case 'ollama':
        return new ChatOllama({
          baseUrl: config.baseURL || 'http://localhost:11434',
          model: config.model,
          temperature: config.temperature,
          numPredict: config.maxTokens,
        });

      default:
        throw new Error(`不支持的 LLM 提供者: ${config.provider}`);
    }
  }

  /**
   * 创建提取任务专用的 LLM 实例
   */
  static createExtractionLLM(config: LLMConfig): BaseLanguageModel {
    const extractionConfig = {
      ...config,
      model: config.extraction.model || config.model,
      temperature: config.extraction.temperature,
      maxTokens: config.extraction.maxTokens || config.maxTokens,
    };
    
    return this.createLLM(extractionConfig);
  }

  /**
   * 创建翻译任务专用的 LLM 实例
   */
  static createTranslationLLM(config: LLMConfig): BaseLanguageModel {
    const translationConfig = {
      ...config,
      model: config.translation.model || config.model,
      temperature: config.translation.temperature,
      maxTokens: config.translation.maxTokens || config.maxTokens,
    };
    
    return this.createLLM(translationConfig);
  }

  /**
   * 验证配置
   */
  static validateConfig(config: LLMConfig): void {
    // 检查必需的配置项
    if (!config.model) {
      throw new Error('模型名称不能为空');
    }

    // 检查不同提供者的特定配置
    switch (config.provider) {
      case 'openai':
      case 'anthropic':
        if (!config.apiKey) {
          throw new Error(`${config.provider} 提供者需要 API Key`);
        }
        break;
      case 'ollama':
        if (!config.baseURL) {
          throw new Error('Ollama 提供者需要指定 baseURL');
        }
        break;
    }
  }
}
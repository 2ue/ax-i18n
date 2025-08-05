import { BaseLanguageModel } from '@langchain/core/language_models/base';
import { HumanMessage } from '@langchain/core/messages';
import type { ExtractionResult, TranslationResult, LLMConfig } from '../config/types.js';
import { LLMProviderFactory } from './factory.js';

/**
 * LLM 客户端
 */
export class LLMClient {
  private extractionLLM: BaseLanguageModel;
  private translationLLM: BaseLanguageModel;
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
    LLMProviderFactory.validateConfig(config);
    
    this.extractionLLM = LLMProviderFactory.createExtractionLLM(config);
    this.translationLLM = LLMProviderFactory.createTranslationLLM(config);
  }

  /**
   * 执行文本提取
   */
  async extractTexts(prompt: string): Promise<ExtractionResult> {
    try {
      const response = await this.invokeWithRetry(
        this.extractionLLM,
        prompt,
        this.config.retryCount
      );

      return this.parseExtractionResponse(response);
    } catch (error) {
      throw new Error(`文本提取失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 执行文本翻译
   */
  async translateTexts(prompt: string): Promise<TranslationResult> {
    try {
      const response = await this.invokeWithRetry(
        this.translationLLM,
        prompt,
        this.config.retryCount
      );

      return this.parseTranslationResponse(response);
    } catch (error) {
      throw new Error(`文本翻译失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 批量翻译文本
   */
  async batchTranslateTexts(texts: Record<string, string>): Promise<Record<string, string>> {
    const batchSize = this.config.translation.batchSize;
    const keys = Object.keys(texts);
    const translations: Record<string, string> = {};

    // 分批处理
    for (let i = 0; i < keys.length; i += batchSize) {
      const batchKeys = keys.slice(i, i + batchSize);
      const batchTexts = Object.fromEntries(
        batchKeys.map(key => [key, texts[key]])
      );

      try {
        const batchTranslations = await this.translateBatch(batchTexts);
        Object.assign(translations, batchTranslations);
      } catch (error) {
        console.warn(`批次 ${Math.floor(i / batchSize) + 1} 翻译失败:`, error);
        // 失败的批次使用原文
        for (const key of batchKeys) {
          translations[key] = texts[key];
        }
      }
    }

    return translations;
  }

  /**
   * 翻译单个批次
   */
  private async translateBatch(texts: Record<string, string>): Promise<Record<string, string>> {
    // 使用 TemplateManager 编译翻译模板
    const templateManager = new TemplateManager();
    const templateResult = await templateManager.compileTranslationTemplate(
      texts,
      'zh-CN', // TODO: 从配置中获取
      'en-US'  // TODO: 从配置中获取
    );
    
    const result = await this.translateTexts(templateResult.prompt);
    return result.translations;
  }


  /**
   * 带重试的调用
   */
  private async invokeWithRetry(
    llm: BaseLanguageModel,
    prompt: string,
    maxRetries: number
  ): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const message = new HumanMessage(prompt);
        const response = await llm.invoke([message]);
        return response.content as string;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // 指数退避
          console.warn(`调用失败，${delay}ms 后重试 (${attempt + 1}/${maxRetries}):`, lastError.message);
          await this.sleep(delay);
        }
      }
    }

    throw lastError || new Error('调用失败');
  }

  /**
   * 解析提取响应
   */
  private parseExtractionResponse(response: string): ExtractionResult {
    try {
      // 提取 JSON 部分
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : response;
      
      const parsed = JSON.parse(jsonStr);
      
      if (!parsed.extractedTexts || !parsed.transformedCode) {
        throw new Error('响应格式不正确，缺少必需字段');
      }

      return {
        extractedTexts: parsed.extractedTexts,
        transformedCode: parsed.transformedCode,
      };
    } catch (error) {
      throw new Error(`解析提取响应失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 解析翻译响应
   */
  private parseTranslationResponse(response: string): TranslationResult {
    try {
      // 提取 JSON 部分
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : response;
      
      const parsed = JSON.parse(jsonStr);
      
      if (!parsed.translations) {
        throw new Error('响应格式不正确，缺少 translations 字段');
      }

      return {
        translations: parsed.translations,
      };
    } catch (error) {
      throw new Error(`解析翻译响应失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 睡眠函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 测试连接
   */
  async testConnection(): Promise<boolean> {
    try {
      const testPrompt = '请回复 "连接成功"';
      const response = await this.invokeWithRetry(this.extractionLLM, testPrompt, 1);
      return response.includes('连接成功') || response.includes('success');
    } catch (error) {
      console.warn('连接测试失败:', error);
      return false;
    }
  }
}
import fs from 'fs-extra';
import type { I18nConfig, ProcessingStats } from '../config/types.js';
import type { ScanResult } from '../scanner/types.js';
import type { FileProcessResult } from './types.js';
import { FileScanner } from '../scanner/scanner.js';
import { TemplateManager } from '../templates/manager.js';
import { LLMClient } from '../llm/client.js';
import { TextExtractor } from './text-extractor.js';
import { CodeTransformer } from './code-transformer.js';
import { FileWriter } from './file-writer.js';

/**
 * 文件处理器 - 协调各个组件完成文件处理
 */
export class FileProcessor {
  private config: I18nConfig;
  private scanner: FileScanner;
  private llmClient: LLMClient;
  private textExtractor: TextExtractor;
  private codeTransformer: CodeTransformer;
  private fileWriter: FileWriter;
  private allExtractedTexts: Record<string, string> = {};

  constructor(config: I18nConfig) {
    this.config = config;
    this.scanner = new FileScanner(config);
    
    const templateManager = new TemplateManager();
    this.llmClient = new LLMClient(
      config.llm, 
      config.locale, 
      config.displayLanguage,
      { enabled: true, cacheDir: '.ai-i18n-cache' }
    );
    
    this.textExtractor = new TextExtractor(config, this.llmClient, templateManager);
    this.codeTransformer = new CodeTransformer(config);
    this.fileWriter = new FileWriter(config);
  }

  /**
   * 处理所有文件
   */
  async processAll(options: { skipTranslate?: boolean; concurrency?: number } = {}): Promise<ProcessingStats> {
    const startTime = Date.now();
    const { concurrency = 3 } = options;
    
    try {
      // 扫描文件
      const { files } = await this.scanner.scan();
      const targetFiles = files.filter(file => this.scanner.shouldProcessFile(file));

      console.log(`发现 ${targetFiles.length} 个需要处理的文件`);

      // 并发处理文件
      const results = await this.processFilesConcurrently(targetFiles, concurrency);
      const failedFiles = results.filter(r => !r.success).map(r => r.filePath);
      const totalExtracted = results.reduce((sum, r) => sum + r.extractedCount, 0);

      // 生成本地化文件
      await this.fileWriter.writeLocalizationFiles(this.allExtractedTexts);

      // 翻译处理
      let translatedCount = 0;
      if (!options.skipTranslate && Object.keys(this.allExtractedTexts).length > 0) {
        translatedCount = await this.processTranslation();
      }

      return {
        filesProcessed: results.filter(r => r.success).length,
        textsExtracted: totalExtracted,
        textsTranslated: translatedCount,
        failedFiles,
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      throw new Error(`处理失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 并发处理文件
   */
  private async processFilesConcurrently(
    files: ScanResult[], 
    concurrency: number
  ): Promise<FileProcessResult[]> {
    const results: FileProcessResult[] = [];
    
    // 分批处理
    for (let i = 0; i < files.length; i += concurrency) {
      const batch = files.slice(i, i + concurrency);
      const batchPromises = batch.map(file => this.processFile(file));
      
      try {
        const batchResults = await Promise.allSettled(batchPromises);
        
        for (let j = 0; j < batchResults.length; j++) {
          const result = batchResults[j];
          if (result.status === 'fulfilled') {
            results.push(result.value);
          } else {
            const file = batch[j];
            results.push({
              filePath: file.filePath,
              success: false,
              extractedCount: 0,
              error: result.reason instanceof Error ? result.reason.message : String(result.reason),
              processingTime: 0,
            });
          }
        }
      } catch (error) {
        // 如果整个批次失败，为每个文件创建失败结果
        batch.forEach(file => {
          results.push({
            filePath: file.filePath,
            success: false,
            extractedCount: 0,
            error: error instanceof Error ? error.message : String(error),
            processingTime: 0,
          });
        });
      }
    }
    
    return results;
  }

  /**
   * 处理单个文件
   */
  async processFile(file: ScanResult): Promise<FileProcessResult> {
    const startTime = Date.now();
    
    try {
      console.log(`处理文件: ${file.relativePath}`);

      // 读取文件内容
      const fileContent = await fs.readFile(file.filePath, 'utf-8');
      
      // 提取文本
      const extractionResult = await this.textExtractor.extractFromFile(file, fileContent);
      
      // 转换代码
      const transformResult = await this.codeTransformer.transformCode(
        file, 
        extractionResult.transformedCode,
        extractionResult.extractedTexts
      );

      // 输出警告信息
      if (transformResult.warnings.length > 0) {
        console.warn(`文件 ${file.relativePath} 处理警告:`, transformResult.warnings);
      }

      // 语法验证失败时抛出错误
      if (!transformResult.isValid) {
        throw new Error(`语法验证失败: ${transformResult.warnings.join(', ')}`);
      }

      // 写入文件
      const writeResult = await this.fileWriter.writeProcessedFile(file, transformResult.transformedCode);
      
      if (!writeResult.success) {
        throw new Error(`文件写入失败: ${writeResult.error}`);
      }

      // 收集提取的文本
      for (const [tempKey, text] of Object.entries(extractionResult.extractedTexts)) {
        const realKey = transformResult.keyMapping[tempKey];
        if (realKey) {
          this.allExtractedTexts[realKey] = text;
        }
      }

      return {
        filePath: file.filePath,
        success: true,
        extractedCount: Object.keys(extractionResult.extractedTexts).length,
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`处理文件失败 ${file.relativePath}:`, errorMsg);
      
      return {
        filePath: file.filePath,
        success: false,
        extractedCount: 0,
        error: errorMsg,
        processingTime: Date.now() - startTime,
      };
    }
  }

  /**
   * 处理翻译
   */
  private async processTranslation(): Promise<number> {
    try {
      console.log(`开始翻译 ${Object.keys(this.allExtractedTexts).length} 个文本...`);
      
      // 批量翻译
      const translations = await this.llmClient.batchTranslateTexts(this.allExtractedTexts);
      
      // 写入翻译文件
      const writeResult = await this.fileWriter.writeTranslationFile(
        this.config.displayLanguage, 
        translations
      );
      
      if (!writeResult.success) {
        throw new Error(`翻译文件写入失败: ${writeResult.error}`);
      }
      
      return Object.keys(translations).length;
    } catch (error) {
      console.error('翻译处理失败:', error);
      return 0;
    }
  }

  /**
   * 获取提取的文本
   */
  getExtractedTexts(): Record<string, string> {
    return { ...this.allExtractedTexts };
  }

  /**
   * 获取缓存统计信息
   */
  getCacheStats() {
    return this.llmClient.getCacheStats();
  }

  /**
   * 清理缓存和内部状态
   */
  clear(): void {
    this.allExtractedTexts = {};
    this.codeTransformer.clear();
    this.llmClient.clearCache();
  }

  /**
   * 清理过期缓存
   */
  cleanupCache(): void {
    this.llmClient.cleanupCache();
  }
}
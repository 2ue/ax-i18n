import fs from 'fs-extra';
import path from 'path';
import type { ScanResult } from '../scanner/types.js';
import type { I18nConfig } from '../config/types.js';

/**
 * 文件写入结果
 */
export interface WriteResult {
  /** 写入的文件路径 */
  filePath: string;
  /** 是否成功 */
  success: boolean;
  /** 错误信息 */
  error?: string;
  /** 写入时间 */
  timestamp: number;
}

/**
 * 文件写入器 - 专门负责文件的写入操作
 */
export class FileWriter {
  constructor(private config: I18nConfig) {}

  /**
   * 写入处理后的文件
   */
  async writeProcessedFile(file: ScanResult, content: string): Promise<WriteResult> {
    const startTime = Date.now();
    
    try {
      const targetPath = this.getTargetPath(file);
      
      // 确保目标目录存在
      await fs.ensureDir(path.dirname(targetPath));
      
      // 写入文件
      await fs.writeFile(targetPath, content, 'utf-8');
      
      return {
        filePath: targetPath,
        success: true,
        timestamp: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      return {
        filePath: file.filePath,
        success: false,
        error: errorMessage,
        timestamp: Date.now() - startTime,
      };
    }
  }

  /**
   * 生成本地化文件
   */
  async writeLocalizationFiles(allExtractedTexts: Record<string, string>): Promise<WriteResult[]> {
    const results: WriteResult[] = [];
    
    if (Object.keys(allExtractedTexts).length === 0) {
      console.log('没有提取到文本，跳过本地化文件生成');
      return results;
    }

    try {
      // 确保输出目录存在
      await fs.ensureDir(this.config.outputDir);

      // 生成主语言文件
      const localeResult = await this.writeLocaleFile(
        this.config.locale,
        allExtractedTexts
      );
      results.push(localeResult);

      console.log(`生成本地化文件: ${localeResult.filePath}`);
      
      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      results.push({
        filePath: this.config.outputDir,
        success: false,
        error: errorMessage,
        timestamp: 0,
      });
      
      return results;
    }
  }

  /**
   * 写入翻译文件
   */
  async writeTranslationFile(
    targetLanguage: string, 
    translations: Record<string, string>
  ): Promise<WriteResult> {
    const startTime = Date.now();
    
    try {
      await fs.ensureDir(this.config.outputDir);
      
      const translationFileName = this.config.output.localeFileName.replace('{locale}', targetLanguage);
      const translationFilePath = path.join(this.config.outputDir, translationFileName);
      
      const translationData = this.config.output.prettyJson
        ? JSON.stringify(translations, null, 2)
        : JSON.stringify(translations);
      
      await fs.writeFile(translationFilePath, translationData, 'utf-8');
      
      console.log(`生成翻译文件: ${translationFilePath}`);
      
      return {
        filePath: translationFilePath,
        success: true,
        timestamp: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      return {
        filePath: `${this.config.outputDir}/${targetLanguage}.json`,
        success: false,
        error: errorMessage,
        timestamp: Date.now() - startTime,
      };
    }
  }

  /**
   * 批量写入文件
   */
  async writeMultiple(
    writes: Array<{ file: ScanResult; content: string }>
  ): Promise<WriteResult[]> {
    const results = await Promise.allSettled(
      writes.map(({ file, content }) => this.writeProcessedFile(file, content))
    );

    return results.map((result) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        const error = result.reason instanceof Error ? result.reason : new Error(String(result.reason));
        return {
          filePath: 'unknown',
          success: false,
          error: error.message,
          timestamp: 0,
        };
      }
    });
  }

  /**
   * 获取目标文件路径
   */
  private getTargetPath(file: ScanResult): string {
    if (this.config.tempDir) {
      // 写入临时目录，保持相对路径结构
      const relativePath = path.relative(process.cwd(), file.filePath);
      return path.join(this.config.tempDir, relativePath);
    } else {
      // 直接覆盖原文件
      return file.filePath;
    }
  }

  /**
   * 写入单个语言文件
   */
  private async writeLocaleFile(
    locale: string,
    texts: Record<string, string>
  ): Promise<WriteResult> {
    const startTime = Date.now();
    
    try {
      const localeFileName = this.config.output.localeFileName.replace('{locale}', locale);
      const localeFilePath = path.join(this.config.outputDir, localeFileName);
      
      const localeData = this.config.output.prettyJson 
        ? JSON.stringify(texts, null, 2)
        : JSON.stringify(texts);
      
      await fs.writeFile(localeFilePath, localeData, 'utf-8');
      
      return {
        filePath: localeFilePath,
        success: true,
        timestamp: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      return {
        filePath: `${this.config.outputDir}/${locale}.json`,
        success: false,
        error: errorMessage,
        timestamp: Date.now() - startTime,
      };
    }
  }

  /**
   * 清理临时文件
   */
  async cleanupTempFiles(): Promise<void> {
    if (this.config.tempDir) {
      try {
        await fs.remove(this.config.tempDir);
        console.log(`清理临时目录: ${this.config.tempDir}`);
      } catch (error) {
        console.warn(`清理临时目录失败: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  /**
   * 获取写入统计信息
   */
  getWriteStats(results: WriteResult[]): {
    successful: number;
    failed: number;
    totalTime: number;
    averageTime: number;
  } {
    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;
    const totalTime = results.reduce((sum, r) => sum + r.timestamp, 0);
    const averageTime = results.length > 0 ? totalTime / results.length : 0;

    return {
      successful,
      failed,
      totalTime,
      averageTime,
    };
  }
}
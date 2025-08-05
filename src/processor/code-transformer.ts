import path from 'path';
import type { ScanResult } from '../scanner/types.js';
import type { I18nConfig } from '../config/types.js';
import { KeyGenerator } from '../utils/key-generator.js';
import { AutoImportManager } from '../utils/auto-import.js';
import { SyntaxValidator } from '../utils/syntax-validator.js';

/**
 * 代码转换结果
 */
export interface TransformResult {
  /** 转换后的代码 */
  transformedCode: string;
  /** 生成的key映射 */
  keyMapping: Record<string, string>;
  /** 语法验证结果 */
  isValid: boolean;
  /** 警告信息 */
  warnings: string[];
}

/**
 * 代码转换器 - 专门负责代码转换和key替换
 */
export class CodeTransformer {
  private keyGenerator: KeyGenerator;
  private autoImportManager: AutoImportManager;

  constructor(config: I18nConfig) {
    this.keyGenerator = new KeyGenerator(config.keyGeneration);
    this.autoImportManager = new AutoImportManager(config.replacement.autoImport);
  }

  /**
   * 转换代码
   */
  async transformCode(
    file: ScanResult,
    originalCode: string,
    extractedTexts: Record<string, string>
  ): Promise<TransformResult> {
    try {
      // 生成真实的key映射
      const keyMapping = this.generateKeyMapping(extractedTexts);
      
      // 替换临时key为真实key
      let transformedCode = this.keyGenerator.replaceTempKeys(originalCode, keyMapping);

      // 处理自动导入
      transformedCode = await this.processAutoImport(transformedCode, file);

      // 语法验证
      const validationResult = this.validateSyntax(transformedCode, file);

      return {
        transformedCode,
        keyMapping,
        isValid: validationResult.valid,
        warnings: validationResult.warnings,
      };
    } catch (error) {
      throw new Error(`代码转换失败 ${file.relativePath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 生成key映射
   */
  private generateKeyMapping(extractedTexts: Record<string, string>): Record<string, string> {
    const keyMapping: Record<string, string> = {};
    
    for (const [tempKey, text] of Object.entries(extractedTexts)) {
      const realKey = this.keyGenerator.generateKey(text);
      keyMapping[tempKey] = realKey;
    }
    
    return keyMapping;
  }

  /**
   * 处理自动导入
   */
  private async processAutoImport(code: string, file: ScanResult): Promise<string> {
    const autoImportResult = this.autoImportManager.processAutoImport(code, file.filePath);
    
    if (autoImportResult.added && autoImportResult.importStatement && autoImportResult.insertPosition !== undefined) {
      return this.autoImportManager.insertImportStatement(
        code,
        autoImportResult.importStatement,
        autoImportResult.insertPosition
      );
    }
    
    return code;
  }

  /**
   * 语法验证
   */
  private validateSyntax(code: string, file: ScanResult): { valid: boolean; warnings: string[] } {
    const fileExtension = path.extname(file.filePath);
    
    if (!SyntaxValidator.isSupported(fileExtension)) {
      return { valid: true, warnings: [`文件类型 ${fileExtension} 不支持语法验证`] };
    }
    
    const validationResult = SyntaxValidator.validateSyntax(code, fileExtension);
    
    return {
      valid: validationResult.valid,
      warnings: [...validationResult.warnings, ...validationResult.errors]
    };
  }

  /**
   * 批量转换代码
   */
  async transformMultiple(
    transformations: Array<{
      file: ScanResult;
      originalCode: string;
      extractedTexts: Record<string, string>;
    }>
  ): Promise<Array<{
    file: ScanResult;
    result: TransformResult | null;
    error?: Error;
  }>> {
    const results = await Promise.allSettled(
      transformations.map(async ({ file, originalCode, extractedTexts }) => ({
        file,
        result: await this.transformCode(file, originalCode, extractedTexts),
      }))
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          file: transformations[index].file,
          result: null,
          error: result.reason instanceof Error ? result.reason : new Error(String(result.reason))
        };
      }
    });
  }

  /**
   * 获取已生成的所有key
   */
  getAllGeneratedKeys(): Record<string, string> {
    const textToKeyMap = this.keyGenerator.getTextToKeyMap();
    const result: Record<string, string> = {};
    
    for (const [text, key] of textToKeyMap.entries()) {
      result[key] = text;
    }
    
    return result;
  }

  /**
   * 清理内部状态
   */
  clear(): void {
    this.keyGenerator.clear();
  }
}
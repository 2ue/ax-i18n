import fs from 'fs-extra';
import path from 'path';
import type { I18nConfig, ProcessingStats } from '../config/types.js';
import type { ScanResult } from '../scanner/types.js';
import type { FileProcessResult } from './types.js';
import { FileScanner } from '../scanner/scanner.js';
import { TemplateManager } from '../templates/manager.js';
import { LLMClient } from '../llm/client.js';
import { KeyGenerator } from '../utils/key-generator.js';
import { AutoImportManager } from '../utils/auto-import.js';
import { SyntaxValidator } from '../utils/syntax-validator.js';

/**
 * 文件处理器
 */
export class FileProcessor {
  private config: I18nConfig;
  private scanner: FileScanner;
  private templateManager: TemplateManager;
  private llmClient: LLMClient;
  private keyGenerator: KeyGenerator;
  private autoImportManager: AutoImportManager;
  private allExtractedTexts: Record<string, string> = {};

  constructor(config: I18nConfig) {
    this.config = config;
    this.scanner = new FileScanner(config);
    this.templateManager = new TemplateManager();
    this.llmClient = new LLMClient(
      config.llm, 
      config.locale, 
      config.displayLanguage,
      { enabled: true, cacheDir: '.ai-i18n-cache' }
    );
    this.keyGenerator = new KeyGenerator(config.keyGeneration);
    this.autoImportManager = new AutoImportManager(config.replacement.autoImport);
  }

  /**
   * 处理所有文件
   */
  async processAll(options: { skipTranslate?: boolean } = {}): Promise<ProcessingStats> {
    const startTime = Date.now();
    
    try {
      // 扫描文件
      const { files } = await this.scanner.scan();
      const targetFiles = files.filter(file => this.scanner.shouldProcessFile(file));

      console.log(`发现 ${targetFiles.length} 个需要处理的文件`);

      // 处理文件
      const results: FileProcessResult[] = [];
      const failedFiles: string[] = [];
      let totalExtracted = 0;

      for (const file of targetFiles) {
        try {
          const result = await this.processFile(file);
          results.push(result);
          
          if (result.success) {
            totalExtracted += result.extractedCount;
          } else {
            failedFiles.push(file.filePath);
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          failedFiles.push(file.filePath);
          results.push({
            filePath: file.filePath,
            success: false,
            extractedCount: 0,
            error: errorMsg,
            processingTime: 0,
          });
        }
      }

      // 生成本地化文件
      await this.generateLocalizationFiles();

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
   * 处理单个文件
   */
  async processFile(file: ScanResult): Promise<FileProcessResult> {
    const startTime = Date.now();
    
    try {
      console.log(`处理文件: ${file.relativePath}`);

      // 读取文件内容
      const fileContent = await fs.readFile(file.filePath, 'utf-8');
      
      // 获取模板类型
      const templateType = this.scanner.getTemplateType(file);
      
      // 编译提示词
      const templateResult = await this.templateManager.compileTemplate(templateType, {
        locale: this.config.locale,
        displayLanguage: this.config.displayLanguage,
        functionName: this.config.replacement.functionName,
        autoImport: this.config.replacement.autoImport,
        fileContent,
        fileType: file.fileType,
      });

      // 调用LLM提取文本  
      const extractionResult = await this.llmClient.extractTexts(templateResult.prompt);
      
      // 生成真实的key
      const tempKeys = Object.keys(extractionResult.extractedTexts);
      const keyMapping: Record<string, string> = {};
      
      for (const tempKey of tempKeys) {
        const text = extractionResult.extractedTexts[tempKey];
        const realKey = this.keyGenerator.generateKey(text);
        keyMapping[tempKey] = realKey;
        this.allExtractedTexts[realKey] = text;
      }

      // 替换临时key为真实key
      let finalCode = this.keyGenerator.replaceTempKeys(
        extractionResult.transformedCode,
        keyMapping
      );

      // 处理自动导入
      const autoImportResult = this.autoImportManager.processAutoImport(finalCode, file.filePath);
      if (autoImportResult.added && autoImportResult.importStatement && autoImportResult.insertPosition !== undefined) {
        finalCode = this.autoImportManager.insertImportStatement(
          finalCode,
          autoImportResult.importStatement,
          autoImportResult.insertPosition
        );
      }

      // 语法验证
      const fileExtension = path.extname(file.filePath);
      if (SyntaxValidator.isSupported(fileExtension)) {
        const validationResult = SyntaxValidator.validateSyntax(finalCode, fileExtension);
        
        if (!validationResult.valid) {
          console.warn(`文件 ${file.relativePath} 语法验证失败:`, validationResult.errors);
          
          // 如果语法验证失败，可以选择回滚或继续
          if (validationResult.errors.some(error => error.includes('语法错误'))) {
            throw new Error(`语法验证失败: ${validationResult.errors.join(', ')}`);
          }
        }
        
        if (validationResult.warnings.length > 0) {
          console.warn(`文件 ${file.relativePath} 语法警告:`, validationResult.warnings);
        }
      }

      // 写回文件
      await this.writeProcessedFile(file, finalCode);

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
   * 写回处理后的文件
   */
  private async writeProcessedFile(file: ScanResult, content: string): Promise<void> {
    let targetPath: string;
    
    if (this.config.tempDir) {
      // 写入临时目录，保持相对路径结构
      const relativePath = path.relative(process.cwd(), file.filePath);
      targetPath = path.join(this.config.tempDir, relativePath);
      await fs.ensureDir(path.dirname(targetPath));
    } else {
      // 直接覆盖原文件
      targetPath = file.filePath;
    }

    await fs.writeFile(targetPath, content, 'utf-8');
  }

  /**
   * 生成本地化文件
   */
  private async generateLocalizationFiles(): Promise<void> {
    if (Object.keys(this.allExtractedTexts).length === 0) {
      console.log('没有提取到文本，跳过本地化文件生成');
      return;
    }

    // 确保输出目录存在
    await fs.ensureDir(this.config.outputDir);

    // 生成主语言文件
    const localeFileName = this.config.output.localeFileName.replace('{locale}', this.config.locale);
    const localeFilePath = path.join(this.config.outputDir, localeFileName);
    
    const localeData = this.config.output.prettyJson 
      ? JSON.stringify(this.allExtractedTexts, null, 2)
      : JSON.stringify(this.allExtractedTexts);
    
    await fs.writeFile(localeFilePath, localeData, 'utf-8');
    console.log(`生成本地化文件: ${localeFilePath}`);
  }

  /**
   * 处理翻译
   */
  private async processTranslation(): Promise<number> {
    try {
      console.log(`开始翻译 ${Object.keys(this.allExtractedTexts).length} 个文本...`);
      
      // 批量翻译
      const translations = await this.llmClient.batchTranslateTexts(this.allExtractedTexts);
      
      // 生成翻译文件
      const translationFileName = this.config.output.localeFileName.replace('{locale}', this.config.displayLanguage);
      const translationFilePath = path.join(this.config.outputDir, translationFileName);
      
      const translationData = this.config.output.prettyJson
        ? JSON.stringify(translations, null, 2)
        : JSON.stringify(translations);
      
      await fs.writeFile(translationFilePath, translationData, 'utf-8');
      console.log(`生成翻译文件: ${translationFilePath}`);
      
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
   * 清理缓存
   */
  clear(): void {
    this.allExtractedTexts = {};
    this.keyGenerator.clear();
  }
}
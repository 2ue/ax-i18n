import chalk from 'chalk';
import ora from 'ora';
import type { I18nConfig } from '../config/types.js';
import { TemplateManager } from '../templates/manager.js';
import { LLMClient } from '../llm/client.js';
import { getFileSystem, type FileSystemService } from '../utils/file-system.js';

/**
 * 独立翻译命令处理器
 */
export class TranslateCommand {
  private config: I18nConfig;
  private templateManager: TemplateManager;
  private llmClient: LLMClient;
  private fs: FileSystemService;

  constructor(config: I18nConfig, fileSystem?: FileSystemService) {
    this.config = config;
    this.fs = fileSystem || getFileSystem();
    this.templateManager = new TemplateManager(undefined, this.fs);
    this.llmClient = new LLMClient(config.llm);
  }

  /**
   * 执行翻译命令
   */
  async execute(options: {
    source?: string;
    target?: string;
    output?: string;
  }): Promise<void> {
    const sourceFile = options.source || this.getDefaultSourceFile();
    const targetLanguage = options.target || this.config.displayLanguage;
    const outputFile = options.output || this.getDefaultOutputFile(targetLanguage);

    console.log(chalk.cyan('🌐 翻译配置:'));
    console.log(`  源文件: ${sourceFile}`);
    console.log(`  目标语言: ${targetLanguage}`);
    console.log(`  输出文件: ${outputFile}`);

    // 验证源文件
    if (!await this.fs.pathExists(sourceFile)) {
      throw new Error(`源文件不存在: ${sourceFile}`);
    }

    // 读取源文件
    const sourceTexts = await this.loadSourceTexts(sourceFile);
    const textCount = Object.keys(sourceTexts).length;

    if (textCount === 0) {
      console.log(chalk.yellow('⚠️  源文件中没有找到可翻译的文本'));
      return;
    }

    console.log(chalk.cyan(`📝 发现 ${textCount} 条文本待翻译...`));

    // 执行翻译
    const spinner = ora('🔄 正在翻译...').start();
    
    try {
      const translations = await this.translateTexts(sourceTexts, targetLanguage);
      
      // 保存翻译结果
      await this.saveTranslations(translations, outputFile);
      
      spinner.succeed(chalk.green('✅ 翻译完成'));
      
      // 显示结果统计
      const translatedCount = Object.keys(translations).length;
      console.log(chalk.cyan('\n📊 翻译结果:'));
      console.log(`  翻译文本: ${translatedCount} 条`);
      console.log(`  输出文件: ${outputFile}`);
      
      if (translatedCount < textCount) {
        console.log(chalk.yellow(`  ⚠️  ${textCount - translatedCount} 条文本翻译失败，使用原文`));
      }
      
    } catch (error) {
      spinner.fail(chalk.red('❌ 翻译失败'));
      throw error;
    }
  }

  /**
   * 加载源文本
   */
  private async loadSourceTexts(filePath: string): Promise<Record<string, string>> {
    try {
      const content = await this.fs.readFile(filePath, 'utf-8');
      const parsed = JSON.parse(content);
      
      if (typeof parsed !== 'object' || parsed === null) {
        throw new Error('源文件格式无效，应为JSON对象');
      }
      
      return parsed;
    } catch (error) {
      throw new Error(`读取源文件失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 翻译文本
   */
  private async translateTexts(
    sourceTexts: Record<string, string>, 
    targetLanguage: string
  ): Promise<Record<string, string>> {
    // 使用模板管理器编译翻译提示词
    const templateResult = await this.templateManager.compileTranslationTemplate(
      sourceTexts,
      this.config.locale,
      targetLanguage
    );

    // 调用LLM进行翻译
    const translationResult = await this.llmClient.translateTexts(templateResult.prompt);
    
    return translationResult.translations;
  }

  /**
   * 保存翻译结果
   */
  private async saveTranslations(
    translations: Record<string, string>,
    outputFile: string
  ): Promise<void> {
    // 确保输出目录存在
    await this.fs.ensureDir(this.fs.dirname(outputFile));
    
    // 格式化输出
    const output = this.config.output?.prettyJson 
      ? JSON.stringify(translations, null, 2)
      : JSON.stringify(translations);
    
    await this.fs.writeFile(outputFile, output, 'utf-8');
  }

  /**
   * 获取默认源文件路径
   */
  private getDefaultSourceFile(): string {
    const fileName = this.config.output?.localeFileName?.replace('{locale}', this.config.locale) || `${this.config.locale}.json`;
    return this.fs.join(this.config.outputDir, fileName);
  }

  /**
   * 获取默认输出文件路径
   */
  private getDefaultOutputFile(targetLanguage: string): string {
    const fileName = this.config.output?.localeFileName?.replace('{locale}', targetLanguage) || `${targetLanguage}.json`;
    return this.fs.join(this.config.outputDir, fileName);
  }

  /**
   * 获取支持的语言列表
   */
  static getSupportedLanguages(): Record<string, string> {
    return {
      'en-US': 'English (US)',
      'en-GB': 'English (UK)',
      'ja-JP': 'Japanese',
      'ko-KR': 'Korean',
      'fr-FR': 'French',
      'de-DE': 'German',
      'es-ES': 'Spanish',
      'pt-BR': 'Portuguese (Brazil)',
      'ru-RU': 'Russian',
      'it-IT': 'Italian',
      'nl-NL': 'Dutch',
      'sv-SE': 'Swedish',
      'da-DK': 'Danish',
      'no-NO': 'Norwegian',
      'fi-FI': 'Finnish',
      'pl-PL': 'Polish',
      'cs-CZ': 'Czech',
      'hu-HU': 'Hungarian',
      'ro-RO': 'Romanian',
      'bg-BG': 'Bulgarian',
      'hr-HR': 'Croatian',
      'sk-SK': 'Slovak',
      'sl-SI': 'Slovenian',
      'et-EE': 'Estonian',
      'lv-LV': 'Latvian',
      'lt-LT': 'Lithuanian',
      'ar-SA': 'Arabic',
      'he-IL': 'Hebrew',
      'th-TH': 'Thai',
      'vi-VN': 'Vietnamese',
      'id-ID': 'Indonesian',
      'ms-MY': 'Malay',
      'tl-PH': 'Filipino',
      'hi-IN': 'Hindi',
      'bn-BD': 'Bengali',
      'ur-PK': 'Urdu',
      'fa-IR': 'Persian',
      'tr-TR': 'Turkish',
      'uk-UA': 'Ukrainian',
    };
  }

  /**
   * 验证目标语言
   */
  static isValidLanguage(language: string): boolean {
    return language in this.getSupportedLanguages();
  }
}
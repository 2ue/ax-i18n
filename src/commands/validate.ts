import chalk from 'chalk';
import ora from 'ora';
import type { I18nConfig } from '../config/types.js';
import { LLMClient } from '../llm/client.js';

/**
 * 验证命令处理器
 */
export class ValidateCommand {
  private config: I18nConfig;
  private llmClient: LLMClient;

  constructor(config: I18nConfig) {
    this.config = config;
    this.llmClient = new LLMClient(config.llm);
  }

  /**
   * 执行验证命令
   */
  async execute(): Promise<void> {
    console.log(chalk.cyan('🔍 验证配置和连接...'));

    // 验证LLM连接
    const isConnected = await this.testLLMConnection();
    
    if (isConnected) {
      console.log(chalk.green('✅ LLM连接正常'));
    } else {
      console.log(chalk.red('❌ LLM连接失败'));
      throw new Error('LLM连接验证失败');
    }

    // 显示配置摘要  
    this.displayConfigSummary();
  }

  /**
   * 测试LLM连接
   */
  private async testLLMConnection(): Promise<boolean> {
    const spinner = ora('🤖 测试LLM连接...').start();
    
    try {
      const result = await this.llmClient.testConnection();
      
      if (result) {
        spinner.succeed(chalk.green('LLM连接测试通过'));
      } else {
        spinner.fail(chalk.red('LLM连接测试失败'));
      }
      
      return result;
    } catch (error) {
      spinner.fail(chalk.red(`LLM连接测试失败: ${error instanceof Error ? error.message : String(error)}`));
      return false;
    }
  }

  /**
   * 显示配置摘要
   */
  private displayConfigSummary(): void {
    console.log(chalk.cyan('\n📋 配置摘要:'));
    console.log(`  源语言: ${this.config.locale}`);
    console.log(`  目标语言: ${this.config.displayLanguage}`);
    console.log(`  LLM提供者: ${this.config.llm.provider}`);
    console.log(`  模型: ${this.config.llm.model}`);
    console.log(`  输出目录: ${this.config.outputDir}`);
    console.log(`  翻译函数: ${this.config.replacement.functionName}`);
    
    if (this.config.tempDir) {
      console.log(`  临时目录: ${this.config.tempDir}`);
    }
    
    if (this.config.replacement.autoImport?.enabled) {
      console.log(`  自动导入: 已启用`);
    }

    console.log(chalk.cyan('\n🎯 处理规则:'));
    console.log(`  包含: ${this.config.include.join(', ')}`);
    console.log(`  排除: ${this.config.exclude.join(', ')}`);
    console.log(`  最大中文长度: ${this.config.keyGeneration.maxChineseLength}`);
    console.log(`  哈希长度: ${this.config.keyGeneration.hashLength}`);
  }
}
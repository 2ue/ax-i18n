#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { ConfigManager } from './config/manager.js';
import { FileProcessor } from './processor/processor.js';
import { TranslateCommand } from './commands/translate.js';
import { ValidateCommand } from './commands/validate.js';

const program = new Command();

// 版本信息
program
  .name('ai-i18n')
  .description('AI-powered internationalization tool')
  .version('1.0.0');

/**
 * 初始化命令
 */
program
  .command('init')
  .description('初始化配置文件')
  .option('-o, --output <path>', '配置文件输出路径', 'i18n.config.json')
  .action(async (options) => {
    const spinner = ora('正在初始化配置文件...').start();
    
    try {
      const configManager = new ConfigManager();
      await configManager.initConfig(options.output);
      
      spinner.succeed(chalk.green(`配置文件已创建: ${options.output}`));
      
      console.log(chalk.yellow('\n下一步:'));
      console.log('1. 编辑配置文件以适合您的项目');
      console.log('2. 配置 LLM API 密钥');
      console.log('3. 运行 ai-i18n extract 提取并处理文件');
      
    } catch (error) {
      spinner.fail(chalk.red(`初始化失败: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  });

/**
 * 提取处理命令 - 核心功能
 */
program
  .command('extract')
  .alias('process')
  .description('提取中文文本并生成国际化代码')
  .option('-c, --config <path>', '配置文件路径')
  .option('--dry-run', '试运行，不实际修改文件')
  .option('--skip-translate', '跳过自动翻译步骤')
  .action(async (options) => {
    try {
      const configManager = new ConfigManager();
      const config = await configManager.loadConfig(options.config);
      
      // 验证配置和路径
      await configManager.validatePaths();
      
      // 显示配置信息
      console.log(chalk.cyan('🔧 配置信息:'));
      console.log(`  源语言: ${config.locale}`);
      console.log(`  目标语言: ${config.displayLanguage}`);
      console.log(`  输出目录: ${config.outputDir}`);
      console.log(`  LLM 提供者: ${config.llm.provider}`);
      console.log(`  模型: ${config.llm.model}`);
      
      if (config.tempDir) {
        console.log(chalk.yellow(`  临时目录: ${config.tempDir} (不会修改源文件)`));
      } else {
        console.log(chalk.yellow(`  ⚠️  将直接修改源文件，建议先备份`));
      }
      
      if (options.dryRun) {
        console.log(chalk.yellow('\n📋 试运行模式 - 不会实际修改文件'));
      // TODO: 实现试运行逻辑 - 仅显示将会处理的文件和提取的文本
      console.log('📄 将会处理的文件:');
      return;
      }
      
      // 确认处理
      const answers = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'proceed',
          message: '确认开始提取处理吗？',
          default: false,
        },
      ]);
      
      if (!answers.proceed) {
        console.log(chalk.yellow('操作已取消'));
        return;
      }
      
      const processor = new FileProcessor(config);
      const spinner = ora('🔍 正在扫描和处理文件...').start();
      
      // 处理skipTranslate参数 - 传递给processor
      const stats = await processor.processAll({ skipTranslate: options.skipTranslate });
      
      spinner.succeed(chalk.green('✅ 处理完成'));
      
      // 显示处理结果
      console.log(chalk.cyan('\n📊 处理结果:'));
      console.log(`  处理文件: ${stats.filesProcessed} 个`);
      console.log(`  提取文本: ${stats.textsExtracted} 条`);
      
      if (!options.skipTranslate) {
        console.log(chalk.gray('ℹ️  跳过自动翻译步骤'));
      }
      
      console.log(`  处理耗时: ${Math.round(stats.processingTime / 1000)}s`);
      
      if (!options.skipTranslate && stats.textsTranslated > 0) {
        console.log(`  翻译文本: ${stats.textsTranslated} 条`);
      }
      
      if (stats.failedFiles.length > 0) {
        console.log(chalk.red(`\n❌ 失败文件: ${stats.failedFiles.length} 个`));
        if (stats.failedFiles.length <= 3) {
          stats.failedFiles.forEach(file => {
            console.log(chalk.red(`    ${file}`));
          });
        } else {
          console.log(chalk.red(`    ${stats.failedFiles[0]} 等 ${stats.failedFiles.length} 个文件`));
        }
      }
      
      // 给出后续建议
      console.log(chalk.green('\n🎉 处理完成！'));
      console.log('生成的文件:');
      console.log(`  📁 ${config.outputDir}/${config.locale}.json - 源语言文件`);
      if (!options.skipTranslate && stats.textsTranslated > 0) {
        console.log(`  📁 ${config.outputDir}/${config.displayLanguage}.json - 翻译文件`);
      }
      
      if (options.skipTranslate || stats.textsTranslated === 0) {
        console.log(chalk.yellow('\n💡 提示: 使用 ai-i18n translate 命令可以翻译到其他语言'));
      }
      
    } catch (error) {
      console.error(chalk.red(`❌ 处理失败: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  });

/**
 * 翻译命令
 */
program
  .command('translate')
  .description('翻译已提取的文本到目标语言')
  .option('-c, --config <path>', '配置文件路径')
  .option('-s, --source <path>', '源语言文件路径')
  .option('-t, --target <language>', '目标语言')
  .option('-o, --output <path>', '输出文件路径')
  .action(async (options) => {
    try {
      const configManager = new ConfigManager();
      const config = await configManager.loadConfig(options.config);
      
      const spinner = ora('🌐 正在翻译文本...').start();
      
      const translateCommand = new TranslateCommand(config);
      await translateCommand.execute({
        source: options.source,
        target: options.target,
        output: options.output,
      });
      
      spinner.succeed(chalk.green('翻译完成'));
      
    } catch (error) {
      console.error(chalk.red(`翻译失败: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  });

/**
 * 验证命令
 */
program
  .command('validate')
  .description('验证配置和LLM连接')
  .option('-c, --config <path>', '配置文件路径')
  .action(async (options) => {
    const spinner = ora('🔍 正在验证配置...').start();
    
    try {
      const configManager = new ConfigManager();
      const config = await configManager.loadConfig(options.config);
      await configManager.validatePaths();
      
      spinner.text = '🤖 正在测试LLM连接...';
      
      const validateCommand = new ValidateCommand(config);
      await validateCommand.execute();
      
      spinner.succeed(chalk.green('✅ 配置验证通过'));
      
      console.log(chalk.cyan('\n📋 配置摘要:'));
      console.log(`  配置文件: ${configManager.getConfigPath() || '使用默认配置'}`);
      console.log(`  源语言: ${config.locale}`);
      console.log(`  目标语言: ${config.displayLanguage}`);
      console.log(`  LLM 提供者: ${config.llm.provider} (${config.llm.model})`);
      console.log(`  输出目录: ${config.outputDir}`);
      
    } catch (error) {
      spinner.fail(chalk.red(`❌ 验证失败: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  });

// 错误处理
program.configureOutput({
  writeErr: (str: string) => process.stderr.write(chalk.red(str))
});

// 解析命令行参数
program.parse();

// 如果没有提供命令，显示帮助
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
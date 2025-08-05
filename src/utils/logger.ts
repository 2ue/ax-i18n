import chalk from 'chalk';
import { LoggingConfig } from '../config/types.js';

/**
 * 日志级别
 */
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

/**
 * 日志管理器
 */
export class Logger {
  private config: LoggingConfig;
  private levelMap: Record<string, LogLevel> = {
    minimal: LogLevel.ERROR,
    normal: LogLevel.INFO,
    verbose: LogLevel.DEBUG,
  };

  constructor(config: LoggingConfig) {
    this.config = config;
  }

  /**
   * 错误日志
   */
  error(message: string, error?: Error | unknown): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    
    console.error(chalk.red(`[ERROR] ${message}`));
    if (error) {
      if (error instanceof Error) {
        console.error(chalk.red(`  ${error.message}`));
        if (this.getCurrentLevel() >= LogLevel.DEBUG && error.stack) {
          console.error(chalk.gray(error.stack));
        }
      } else {
        console.error(chalk.red(`  ${String(error)}`));
      }
    }
  }

  /**
   * 警告日志
   */
  warn(message: string, details?: string): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    
    console.warn(chalk.yellow(`[WARN] ${message}`));
    if (details) {
      console.warn(chalk.yellow(`  ${details}`));
    }
  }

  /**
   * 信息日志
   */
  info(message: string, details?: string): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    
    console.log(chalk.blue(`[INFO] ${message}`));
    if (details) {
      console.log(chalk.blue(`  ${details}`));
    }
  }

  /**
   * 调试日志
   */
  debug(message: string, data?: any): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    
    console.log(chalk.gray(`[DEBUG] ${message}`));
    if (data !== undefined) {
      console.log(chalk.gray(`  ${typeof data === 'string' ? data : JSON.stringify(data, null, 2)}`));
    }
  }

  /**
   * 成功日志
   */
  success(message: string, details?: string): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    
    console.log(chalk.green(`[SUCCESS] ${message}`));
    if (details) {
      console.log(chalk.green(`  ${details}`));
    }
  }

  /**
   * 进度日志
   */
  progress(message: string, current: number, total: number): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    
    const percentage = Math.round((current / total) * 100);
    const progressBar = this.createProgressBar(percentage);
    console.log(chalk.cyan(`[PROGRESS] ${message} ${progressBar} ${percentage}% (${current}/${total})`));
  }

  /**
   * 统计日志
   */
  stats(title: string, stats: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    
    console.log(chalk.magenta(`[STATS] ${title}:`));
    for (const [key, value] of Object.entries(stats)) {
      console.log(chalk.magenta(`  ${key}: ${value}`));
    }
  }

  /**
   * 时间日志
   */
  time(label: string): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    console.time(chalk.gray(`[TIME] ${label}`));
  }

  /**
   * 结束时间日志
   */
  timeEnd(label: string): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    console.timeEnd(chalk.gray(`[TIME] ${label}`));
  }

  /**
   * 分组开始
   */
  groupStart(title: string): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    console.group(chalk.bold(title));
  }

  /**
   * 分组结束
   */
  groupEnd(): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    console.groupEnd();
  }

  /**
   * 创建进度条
   */
  private createProgressBar(percentage: number): string {
    const barLength = 20;
    const filledLength = Math.round((barLength * percentage) / 100);
    const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
    return `[${bar}]`;
  }

  /**
   * 判断是否应该记录日志
   */
  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) return false;
    return level <= this.getCurrentLevel();
  }

  /**
   * 获取当前日志级别
   */
  private getCurrentLevel(): LogLevel {
    return this.levelMap[this.config.level] ?? LogLevel.INFO;
  }

  /**
   * 更新配置
   */
  updateConfig(config: LoggingConfig): void {
    this.config = config;
  }
}

/**
 * 全局日志实例
 */
let globalLogger: Logger | null = null;

/**
 * 初始化全局日志
 */
export function initLogger(config: LoggingConfig): Logger {
  globalLogger = new Logger(config);
  return globalLogger;
}

/**
 * 获取全局日志实例
 */
export function getLogger(): Logger {
  if (!globalLogger) {
    // 使用默认配置创建日志实例
    globalLogger = new Logger({
      enabled: true,
      level: 'normal',
    });
  }
  return globalLogger;
}
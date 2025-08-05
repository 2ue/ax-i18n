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
 * 结构化日志上下文
 */
export interface LogContext {
  operation?: string;
  file?: string;
  duration?: number;
  error?: Error | string;
  metadata?: Record<string, any>;
  timestamp?: number;
}

/**
 * 结构化日志条目
 */
export interface LogEntry {
  level: string;
  message: string;
  timestamp: string;
  context?: LogContext;
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
  private isStructured: boolean = false;

  constructor(config: LoggingConfig, structured: boolean = false) {
    this.config = config;
    this.isStructured = structured;
  }

  /**
   * 设置结构化日志模式
   */
  setStructured(structured: boolean): void {
    this.isStructured = structured;
  }

  /**
   * 错误日志
   */
  error(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    
    if (this.isStructured) {
      this.logStructured('error', message, context);
    } else {
      console.error(chalk.red(`[ERROR] ${message}`));
      if (context?.error) {
        if (context.error instanceof Error) {
          console.error(chalk.red(`  ${context.error.message}`));
          if (this.getCurrentLevel() >= LogLevel.DEBUG && context.error.stack) {
            console.error(chalk.gray(context.error.stack));
          }
        } else {
          console.error(chalk.red(`  ${String(context.error)}`));
        }
      }
      if (context?.file) {
        console.error(chalk.gray(`  文件: ${context.file}`));
      }
    }
  }

  /**
   * 警告日志
   */
  warn(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    
    if (this.isStructured) {
      this.logStructured('warn', message, context);
    } else {
      console.warn(chalk.yellow(`[WARN] ${message}`));
      if (context?.file) {
        console.warn(chalk.yellow(`  文件: ${context.file}`));
      }
      if (context?.metadata) {
        console.warn(chalk.yellow(`  详情: ${JSON.stringify(context.metadata)}`));
      }
    }
  }

  /**
   * 信息日志
   */
  info(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    
    if (this.isStructured) {
      this.logStructured('info', message, context);
    } else {
      console.log(chalk.blue(`[INFO] ${message}`));
      if (context?.operation) {
        console.log(chalk.blue(`  操作: ${context.operation}`));
      }
      if (context?.duration !== undefined) {
        console.log(chalk.blue(`  耗时: ${context.duration}ms`));
      }
    }
  }

  /**
   * 调试日志
   */
  debug(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    
    if (this.isStructured) {
      this.logStructured('debug', message, context);
    } else {
      console.log(chalk.gray(`[DEBUG] ${message}`));
      if (context?.metadata !== undefined) {
        console.log(chalk.gray(`  数据: ${JSON.stringify(context.metadata, null, 2)}`));
      }
    }
  }

  /**
   * 成功日志
   */
  success(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    
    if (this.isStructured) {
      this.logStructured('success', message, context);
    } else {
      console.log(chalk.green(`[SUCCESS] ${message}`));
      if (context?.duration !== undefined) {
        console.log(chalk.green(`  耗时: ${context.duration}ms`));
      }
    }
  }

  /**
   * 进度日志
   */
  progress(message: string, current: number, total: number, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    
    const percentage = Math.round((current / total) * 100);
    
    if (this.isStructured) {
      this.logStructured('progress', message, {
        ...context,
        metadata: {
          current,
          total,
          percentage,
          ...context?.metadata
        }
      });
    } else {
      const progressBar = this.createProgressBar(percentage);
      console.log(chalk.cyan(`[PROGRESS] ${message} ${progressBar} ${percentage}% (${current}/${total})`));
    }
  }

  /**
   * 统计日志
   */
  stats(title: string, stats: Record<string, any>, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    
    if (this.isStructured) {
      this.logStructured('stats', title, {
        ...context,
        metadata: { ...stats, ...context?.metadata }
      });
    } else {
      console.log(chalk.magenta(`[STATS] ${title}:`));
      for (const [key, value] of Object.entries(stats)) {
        console.log(chalk.magenta(`  ${key}: ${value}`));
      }
    }
  }

  /**
   * 性能日志
   */
  performance(operation: string, duration: number, context?: LogContext): void {
    this.info(`${operation} 完成`, {
      ...context,
      operation,
      duration,
      metadata: {
        performance: true,
        ...context?.metadata
      }
    });
  }

  /**
   * 文件处理日志
   */
  fileProcessed(file: string, success: boolean, duration: number, context?: LogContext): void {
    const message = `文件${success ? '处理成功' : '处理失败'}: ${file}`;
    
    if (success) {
      this.success(message, { ...context, file, duration });
    } else {
      this.error(message, { ...context, file, duration });
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
   * 结构化日志输出
   */
  private logStructured(level: string, message: string, context?: LogContext): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
    };

    if (context) {
      entry.context = {
        ...context,
        timestamp: Date.now()
      };
    }

    console.log(JSON.stringify(entry));
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

  /**
   * 创建子logger，带有预设上下文
   */
  child(baseContext: LogContext): Logger {
    const childLogger = new Logger(this.config, this.isStructured);
    
    // 重写日志方法以自动添加基础上下文
    const originalError = childLogger.error.bind(childLogger);
    const originalWarn = childLogger.warn.bind(childLogger);
    const originalInfo = childLogger.info.bind(childLogger);
    const originalDebug = childLogger.debug.bind(childLogger);
    const originalSuccess = childLogger.success.bind(childLogger);

    childLogger.error = (message: string, context?: LogContext) => {
      originalError(message, { ...baseContext, ...context });
    };

    childLogger.warn = (message: string, context?: LogContext) => {
      originalWarn(message, { ...baseContext, ...context });
    };

    childLogger.info = (message: string, context?: LogContext) => {
      originalInfo(message, { ...baseContext, ...context });
    };

    childLogger.debug = (message: string, context?: LogContext) => {
      originalDebug(message, { ...baseContext, ...context });
    };

    childLogger.success = (message: string, context?: LogContext) => {
      originalSuccess(message, { ...baseContext, ...context });
    };

    return childLogger;
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
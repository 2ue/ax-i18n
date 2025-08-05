/**
 * 自定义错误类型
 */
export class I18nError extends Error {
  public code: string;
  public details?: any;

  constructor(message: string, code: string = 'UNKNOWN_ERROR', details?: any) {
    super(message);
    this.name = 'I18nError';
    this.code = code;
    this.details = details;
  }
}

/**
 * 配置错误
 */
export class ConfigError extends I18nError {
  constructor(message: string, details?: any) {
    super(message, 'CONFIG_ERROR', details);
    this.name = 'ConfigError';
  }
}

/**
 * 文件处理错误
 */
export class FileProcessError extends I18nError {
  public filePath?: string;

  constructor(message: string, filePath?: string, details?: any) {
    super(message, 'FILE_PROCESS_ERROR', details);
    this.name = 'FileProcessError';
    this.filePath = filePath || '';
  }
}

/**
 * LLM调用错误
 */
export class LLMError extends I18nError {
  public provider?: string;
  public model?: string;

  constructor(message: string, provider?: string, model?: string, details?: any) {
    super(message, 'LLM_ERROR', details);
    this.name = 'LLMError';
    this.provider = provider || '';
    this.model = model || '';
  }
}

/**
 * 翻译错误
 */
export class TranslationError extends I18nError {
  public sourceLanguage?: string;
  public targetLanguage?: string;

  constructor(message: string, sourceLanguage?: string, targetLanguage?: string, details?: any) {
    super(message, 'TRANSLATION_ERROR', details);
    this.name = 'TranslationError';
    this.sourceLanguage = sourceLanguage || '';
    this.targetLanguage = targetLanguage || '';
  }
}

/**
 * 模板错误
 */  
export class TemplateError extends I18nError {
  public templateName?: string;

  constructor(message: string, templateName?: string, details?: any) {
    super(message, 'TEMPLATE_ERROR', details);
    this.name = 'TemplateError';
    this.templateName = templateName || '';
  }
}

/**
 * 错误处理工具
 */
export class ErrorHandler {
  /**
   * 处理并格式化错误
   */
  static handleError(error: unknown): I18nError {
    if (error instanceof I18nError) {
      return error;
    }

    if (error instanceof Error) {
      return new I18nError(error.message, 'GENERIC_ERROR', {
        stack: error.stack,
        originalError: error,
      });
    }

    return new I18nError(String(error), 'UNKNOWN_ERROR', { originalError: error });
  }

  /**
   * 安全地执行异步操作
   */
  static async safeAsync<T>(
    operation: () => Promise<T>,
    errorMessage: string = '操作失败',
    errorCode: string = 'OPERATION_FAILED'
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      const handledError = this.handleError(error);
      throw new I18nError(
        `${errorMessage}: ${handledError.message}`,
        errorCode,
        handledError.details
      );
    }
  }

  /**
   * 安全地执行同步操作
   */
  static safeSync<T>(
    operation: () => T,
    errorMessage: string = '操作失败',
    errorCode: string = 'OPERATION_FAILED'
  ): T {
    try {
      return operation();
    } catch (error) {
      const handledError = this.handleError(error);
      throw new I18nError(
        `${errorMessage}: ${handledError.message}`,
        errorCode,
        handledError.details
      );
    }
  }

  /**
   * 获取错误的详细信息
   */
  static getErrorDetails(error: unknown): {
    message: string;
    code: string;
    details?: any;
    stack?: string;
  } {
    const handledError = this.handleError(error);
    
    return {
      message: handledError.message,
      code: handledError.code,
      details: handledError.details,
      stack: handledError.stack || '',
    };
  }

  /**
   * 格式化错误信息用于显示
   */
  static formatErrorForDisplay(error: unknown): string {
    const details = this.getErrorDetails(error);
    
    let message = `错误: ${details.message}`;
    
    if (details.code !== 'UNKNOWN_ERROR') {
      message += ` (${details.code})`;
    }
    
    // 添加特定错误类型的额外信息
    if (error instanceof FileProcessError && error.filePath) {
      message += `\n文件: ${error.filePath}`;
    }
    
    if (error instanceof LLMError) {
      if (error.provider) message += `\n提供者: ${error.provider}`;
      if (error.model) message += `\n模型: ${error.model}`;
    }
    
    if (error instanceof TranslationError) {
      if (error.sourceLanguage) message += `\n源语言: ${error.sourceLanguage}`;
      if (error.targetLanguage) message += `\n目标语言: ${error.targetLanguage}`;
    }
    
    return message;
  }

  /**
   * 判断错误是否可恢复
   */
  static isRecoverable(error: unknown): boolean {
    if (error instanceof ConfigError) return false;
    if (error instanceof I18nError) {
      return !['CONFIG_ERROR', 'TEMPLATE_ERROR'].includes(error.code);
    }
    return true;
  }

  /**
   * 创建重试策略
   */
  static createRetryStrategy(maxRetries: number = 3, baseDelay: number = 1000) {
    return {
      maxRetries,
      baseDelay,
      
      async execute<T>(operation: () => Promise<T>): Promise<T> {
        let lastError: unknown;
        
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          try {
            return await operation();
          } catch (error) {
            lastError = error;
            
            if (attempt === maxRetries || !ErrorHandler.isRecoverable(error)) {
              throw error;
            }
            
            const delay = baseDelay * Math.pow(2, attempt);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
        
        throw lastError;
      }
    };
  }
}
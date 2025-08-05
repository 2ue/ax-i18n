/**
 * 统一错误处理工具
 */
export class ErrorUtils {
  /**
   * 格式化错误消息
   */
  static formatError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }

  /**
   * 创建带上下文的错误
   */
  static createContextError(
    operation: string,
    context: string,
    originalError: unknown
  ): Error {
    const message = `${operation}失败 ${context}: ${this.formatError(originalError)}`;
    return new Error(message);
  }

  /**
   * 安全执行异步操作
   */
  static async safeAsync<T>(
    operation: () => Promise<T>,
    context: { operation: string; file?: string }
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      const contextInfo = context.file ? `${context.file}` : context.operation;
      throw this.createContextError(context.operation, contextInfo, error);
    }
  }

  /**
   * 安全执行同步操作
   */
  static safeSync<T>(
    operation: () => T,
    context: { operation: string; file?: string }
  ): T {
    try {
      return operation();
    } catch (error) {
      const contextInfo = context.file ? `${context.file}` : context.operation;
      throw this.createContextError(context.operation, contextInfo, error);
    }
  }

  /**
   * 处理Promise.allSettled结果
   */
  static handleSettledResults<T>(
    results: PromiseSettledResult<T>[],
    items: any[],
    createFailureResult: (item: any, error: Error) => T
  ): T[] {
    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        const error = result.reason instanceof Error 
          ? result.reason 
          : new Error(String(result.reason));
        return createFailureResult(items[index], error);
      }
    });
  }

  /**
   * 错误重试机制
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    options: {
      maxRetries?: number;
      baseDelay?: number;
      shouldRetry?: (error: unknown) => boolean;
      context?: string;
    } = {}
  ): Promise<T> {
    const {
      maxRetries = 3,
      baseDelay = 1000,
      shouldRetry = () => true,
      context = '操作'
    } = options;

    let lastError: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        if (attempt === maxRetries || !shouldRetry(error)) {
          throw error;
        }

        const delay = baseDelay * Math.pow(2, attempt);
        console.warn(`${context}失败，${delay}ms 后重试 (${attempt + 1}/${maxRetries}):`, this.formatError(error));
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  /**
   * 创建操作结果
   */
  static createResult<T>(
    success: boolean,
    data?: T,
    error?: string,
    metadata?: Record<string, any>
  ): {
    success: boolean;
    data?: T;
    error?: string;
    timestamp: number;
    metadata?: Record<string, any>;
  } {
    const result: any = {
      success,
      timestamp: Date.now(),
    };
    
    if (data !== undefined) {
      result.data = data;
    }
    
    if (error !== undefined) {
      result.error = error;
    }
    
    if (metadata !== undefined) {
      result.metadata = metadata;
    }
    
    return result;
  }

  /**
   * 批量操作错误收集
   */
  static collectErrors<T>(
    results: Array<{ success: boolean; error?: string; data?: T }>
  ): {
    successful: T[];
    failed: string[];
    stats: { total: number; success: number; failed: number };
  } {
    const successful: T[] = [];
    const failed: string[] = [];

    for (const result of results) {
      if (result.success && result.data) {
        successful.push(result.data);
      } else if (result.error) {
        failed.push(result.error);
      }
    }

    return {
      successful,
      failed,
      stats: {
        total: results.length,
        success: successful.length,
        failed: failed.length
      }
    };
  }

  /**
   * 创建并发限制的Promise执行器
   */
  static async limitConcurrency<T, R>(
    items: T[],
    concurrency: number,
    processor: (item: T) => Promise<R>
  ): Promise<PromiseSettledResult<R>[]> {
    const results: PromiseSettledResult<R>[] = [];

    for (let i = 0; i < items.length; i += concurrency) {
      const batch = items.slice(i, i + concurrency);
      const batchPromises = batch.map(processor);
      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * 验证必需参数
   */
  static validateRequired(
    params: Record<string, any>,
    requiredFields: string[],
    context = '参数验证'
  ): void {
    const missing = requiredFields.filter(field => 
      params[field] === undefined || params[field] === null
    );

    if (missing.length > 0) {
      throw new Error(`${context}: 缺少必需参数 ${missing.join(', ')}`);
    }
  }

  /**
   * 清理资源的包装器
   */
  static async withCleanup<T>(
    operation: () => Promise<T>,
    cleanup: () => Promise<void> | void,
    context = '操作'
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      throw this.createContextError(context, '', error);
    } finally {
      try {
        await cleanup();
      } catch (cleanupError) {
        console.warn(`${context}清理失败:`, this.formatError(cleanupError));
      }
    }
  }
}
/**
 * 文件处理结果
 */
export interface FileProcessResult {
  /** 文件路径 */
  filePath: string;
  /** 是否成功 */
  success: boolean;
  /** 提取的文本数量 */
  extractedCount: number;
  /** 错误信息 */
  error?: string;
  /** 处理时间（毫秒） */
  processingTime: number;
}

/**
 * 自动导入结果
 */
export interface AutoImportResult {
  /** 是否添加了导入 */
  added: boolean;
  /** 添加的导入语句 */
  importStatement?: string;
  /** 插入位置 */
  insertPosition?: number;
}
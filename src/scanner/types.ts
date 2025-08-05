/**
 * 文件扫描结果
 */
export interface ScanResult {
  /** 文件路径 */
  filePath: string;
  /** 文件类型 */
  fileType: string;
  /** 相对路径 */
  relativePath: string;
  /** 文件大小（字节） */
  size: number;
  /** 最后修改时间 */
  mtime: Date;
}

/**
 * 扫描统计信息
 */
export interface ScanStats {
  /** 总文件数 */
  totalFiles: number;
  /** 按类型分组的文件数 */
  filesByType: Record<string, number>;
  /** 扫描耗时（毫秒） */
  scanTime: number;
}
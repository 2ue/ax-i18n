import fg from 'fast-glob';
import path from 'path';
import fs from 'fs-extra';
import type { ScanResult, ScanStats } from './types.js';
import type { I18nConfig } from '../config/types.js';

/**
 * 文件扫描器
 */
export class FileScanner {
  private config: I18nConfig;

  constructor(config: I18nConfig) {
    this.config = config;
  }

  /**
   * 扫描文件
   */
  async scan(): Promise<{ files: ScanResult[]; stats: ScanStats }> {
    const startTime = Date.now();
    
    try {
      // 使用 fast-glob 扫描文件
      const filePaths = await fg(this.config.include, {
        ignore: this.config.exclude,
        absolute: true,
        onlyFiles: true,
        dot: false,
      });

      // 获取文件信息
      const files = await this.getFileInfo(filePaths);
      
      // 生成统计信息
      const stats = this.generateStats(files, Date.now() - startTime);
      
      return { files, stats };
    } catch (error) {
      throw new Error(`文件扫描失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取文件信息
   */
  private async getFileInfo(filePaths: string[]): Promise<ScanResult[]> {
    const results: ScanResult[] = [];
    
    for (const filePath of filePaths) {
      try {
        const stats = await fs.stat(filePath);
        const ext = path.extname(filePath);
        const relativePath = path.relative(process.cwd(), filePath);
        
        results.push({
          filePath,
          fileType: ext,
          relativePath,
          size: stats.size,
          mtime: stats.mtime,
        });
      } catch (error) {
        console.warn(`无法获取文件信息: ${filePath}`, error);
      }
    }
    
    return results;
  }

  /**
   * 生成统计信息
   */
  private generateStats(files: ScanResult[], scanTime: number): ScanStats {
    const filesByType: Record<string, number> = {};
    
    for (const file of files) {
      const type = file.fileType || 'unknown';
      filesByType[type] = (filesByType[type] || 0) + 1;
    }
    
    return {
      totalFiles: files.length,
      filesByType,
      scanTime,
    };
  }

  /**
   * 按文件类型过滤文件
   */
  filterByType(files: ScanResult[], types: string[]): ScanResult[] {
    return files.filter(file => types.includes(file.fileType));
  }

  /**
   * 按大小过滤文件
   */
  filterBySize(files: ScanResult[], maxSize: number): ScanResult[] {
    return files.filter(file => file.size <= maxSize);
  }

  /**
   * 按修改时间过滤文件
   */
  filterByMtime(files: ScanResult[], since: Date): ScanResult[] {
    return files.filter(file => file.mtime >= since);
  }

  /**
   * 检查文件是否应该处理
   */
  shouldProcessFile(file: ScanResult): boolean {
    const supportedExtensions = ['.js', '.jsx', '.ts', '.tsx', '.vue'];
    return supportedExtensions.includes(file.fileType);
  }

  /**
   * 获取文件的模板类型
   */
  getTemplateType(file: ScanResult): string {
    const templateMap: Record<string, string> = {
      '.tsx': 'extraction-react-tsx',
      '.jsx': 'extraction-react-jsx',
      '.ts': 'extraction-typescript',
      '.js': 'extraction-javascript',
      '.vue': 'extraction-vue',
    };
    
    return templateMap[file.fileType] || 'extraction-generic';
  }

  /**
   * 分析文件内容，获取中文文本预览
   */
  async analyzeFileContent(filePath: string): Promise<{
    chineseTextCount: number;
    chineseTexts: string[];
    hasImports: boolean;
    estimatedComplexity: 'low' | 'medium' | 'high';
  }> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      
      // 简单的中文文本匹配
      const chineseRegex = /['"`]([^'"`]*[\u4e00-\u9fa5][^'"`]*?)['"`]/g;
      const matches = [...content.matchAll(chineseRegex)];
      const chineseTexts = matches.map(match => match[1]).slice(0, 10); // 只取前10个
      
      // 检查是否已有i18n导入
      const hasImports = /import.*from\s+['"].*i18n|useTranslation|useI18n/i.test(content);
      
      // 估算复杂度
      let complexity: 'low' | 'medium' | 'high' = 'low';
      if (chineseTexts.length > 20) complexity = 'high';
      else if (chineseTexts.length > 5) complexity = 'medium';
      
      return {
        chineseTextCount: chineseTexts.length,
        chineseTexts,
        hasImports,
        estimatedComplexity: complexity,
      };
    } catch (error) {
      return {
        chineseTextCount: 0,
        chineseTexts: [],
        hasImports: false,
        estimatedComplexity: 'low',
      };
    }
  }

  /**
   * 获取项目i18n状态分析
   */
  async getProjectI18nStatus(files: ScanResult[]): Promise<{
    totalFiles: number;
    i18nReadyFiles: number;
    needProcessingFiles: number;
    estimatedWorkload: string;
    recommendations: string[];
  }> {
    let i18nReadyFiles = 0;
    let totalChineseTexts = 0;
    const recommendations: string[] = [];
    
    // 分析文件状态
    for (const file of files.slice(0, 20)) { // 限制分析文件数量
      if (this.shouldProcessFile(file)) {
        const analysis = await this.analyzeFileContent(file.filePath);
        totalChineseTexts += analysis.chineseTextCount;
        
        if (analysis.hasImports && analysis.chineseTextCount === 0) {
          i18nReadyFiles++;
        }
      }
    }
    
    const needProcessingFiles = files.filter(f => this.shouldProcessFile(f)).length - i18nReadyFiles;
    
    // 生成建议
    if (totalChineseTexts > 100) {
      recommendations.push('项目包含大量中文文本，建议分批处理');
      recommendations.push('考虑先处理核心页面和组件');
    }
    
    if (i18nReadyFiles === 0) {
      recommendations.push('项目尚未配置i18n，建议启用自动导入功能');
    }
    
    if (needProcessingFiles > 50) {
      recommendations.push('文件数量较多，建议使用tempDir避免直接修改源文件');
    }
    
    // 估算工作量
    let estimatedWorkload = '轻量';
    if (totalChineseTexts > 200 || needProcessingFiles > 30) {
      estimatedWorkload = '重度';
    } else if (totalChineseTexts > 50 || needProcessingFiles > 10) {
      estimatedWorkload = '中等';
    }
    
    return {
      totalFiles: files.length,
      i18nReadyFiles,
      needProcessingFiles,
      estimatedWorkload,
      recommendations,
    };
  }
}
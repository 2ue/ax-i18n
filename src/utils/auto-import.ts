import type { AutoImportConfig, ImportStatement } from '../config/types.js';
import type { AutoImportResult } from '../processor/types.js';

/**
 * 自动导入管理器
 */
export class AutoImportManager {
  private config: AutoImportConfig;

  constructor(config: AutoImportConfig) {
    this.config = config;
  }

  /**
   * 处理自动导入
   */
  processAutoImport(fileContent: string, filePath: string): AutoImportResult {
    if (!this.config.enabled) {
      return { added: false };
    }

    // 检查是否已存在导入
    if (this.hasExistingImport(fileContent)) {
      return { added: false };
    }

    // 获取导入语句
    const importStatement = this.getImportStatement(filePath);
    if (!importStatement) {
      return { added: false };
    }

    // 确定插入位置
    const insertPosition = this.findInsertPosition(fileContent);
    if (insertPosition === -1) {
      return { added: false };
    }

    return {
      added: true,
      importStatement,
      insertPosition,
    };
  }

  /**
   * 插入导入语句
   */
  insertImportStatement(fileContent: string, importStatement: string, position: number): string {
    const lines = fileContent.split('\n');
    lines.splice(position, 0, importStatement);
    return lines.join('\n');
  }

  /**
   * 检查是否已存在导入
   */
  private hasExistingImport(fileContent: string): boolean {
    // 检查常见的i18n导入模式
    const importPatterns = [
      /import.*from\s+['"]react-i18next['"]/,
      /import.*from\s+['"]vue-i18n['"]/,
      /import.*from\s+['"]@\/i18n['"]/,
      /import.*from\s+['"]@\/utils\/i18n['"]/,
      /import.*\$t.*from/,
      /const.*\$t.*=.*useTranslation/,
      /const.*t.*=.*useTranslation/,
    ];

    return importPatterns.some(pattern => pattern.test(fileContent));
  }

  /**
   * 获取导入语句
   */
  private getImportStatement(filePath: string): string | null {
    if (!this.config.imports) {
      return null;
    }

    // 根据文件路径匹配导入配置
    for (const [pattern, importConfig] of Object.entries(this.config.imports)) {
      if (this.matchesPattern(filePath, pattern)) {
        return importConfig.importStatement;
      }
    }

    return null;
  }

  /**
   * 匹配文件模式
   */
  private matchesPattern(filePath: string, pattern: string): boolean {
    // 简单的glob模式匹配
    const regexPattern = pattern
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*')
      .replace(/\?/g, '.');
    
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(filePath);
  }

  /**
   * 查找插入位置
   */
  private findInsertPosition(fileContent: string): number {
    const lines = fileContent.split('\n');
    
    switch (this.config.insertPosition) {
      case 'top':
        return this.findTopPosition(lines);
      case 'afterImports':
        return this.findAfterImportsPosition(lines);
      case 'beforeFirstUse':
        return this.findBeforeFirstUsePosition(lines);
      default:
        return this.findAfterImportsPosition(lines);
    }
  }

  /**
   * 查找顶部位置
   */
  private findTopPosition(lines: string[]): number {
    // 跳过注释和空行
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line && !line.startsWith('//') && !line.startsWith('/*')) {
        return i;
      }
    }
    return 0;
  }

  /**
   * 查找import语句后的位置
   */
  private findAfterImportsPosition(lines: string[]): number {
    let lastImportIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // 跳过注释和空行
      if (!line || line.startsWith('//') || line.startsWith('/*')) {
        continue;
      }
      
      // 检查是否是import语句
      if (line.startsWith('import ') || line.startsWith('const ') && line.includes('require(')) {
        lastImportIndex = i;
      } else if (lastImportIndex !== -1) {
        // 找到第一个非import语句
        break;
      }
    }
    
    return lastImportIndex === -1 ? 0 : lastImportIndex + 1;
  }

  /**
   * 查找首次使用前的位置
   */
  private findBeforeFirstUsePosition(lines: string[]): number {
    // 查找第一次使用$t的位置
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('$t(') || line.includes('t(')) {
        return Math.max(0, i - 1);
      }
    }
    
    // 如果没找到使用，则在import后插入
    return this.findAfterImportsPosition(lines);
  }

  /**
   * 生成默认导入语句
   */
  static generateDefaultImportStatement(fileType: string, functionName: string): string {
    switch (fileType) {
      case '.tsx':
      case '.jsx':
        return `import { useTranslation } from 'react-i18next';\nconst { ${functionName} } = useTranslation();`;
      case '.vue':
        return `import { useI18n } from 'vue-i18n';\nconst { ${functionName} } = useI18n();`;
      case '.ts':
      case '.js':
      default:
        return `import { ${functionName} } from '@/utils/i18n';`;
    }
  }

  /**
   * 验证导入语句格式
   */
  static validateImportStatement(statement: string): boolean {
    if (!statement || typeof statement !== 'string') {
      return false;
    }
    
    // 基本的JavaScript导入语句检查
    const validPatterns = [
      /^import\s+.+\s+from\s+['"].+['"];?$/,
      /^const\s+.+\s*=\s*.+;$/,
      /^let\s+.+\s*=\s*.+;$/,
      /^var\s+.+\s*=\s*.+;$/,
    ];
    
    return validPatterns.some(pattern => pattern.test(statement.trim()));
  }
}
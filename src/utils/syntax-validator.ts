import { parse } from '@babel/parser';
import type { ParserOptions } from '@babel/parser';

/**
 * 语法验证结果
 */
export interface SyntaxValidationResult {
  /** 是否有效 */
  valid: boolean;
  /** 错误信息 */
  errors: string[];
  /** 警告信息 */
  warnings: string[];
}

/**
 * 语法验证器
 */
export class SyntaxValidator {
  private static readonly PARSER_OPTIONS: Record<string, ParserOptions> = {
    '.ts': {
      sourceType: 'module',
      allowImportExportEverywhere: true,
      allowReturnOutsideFunction: true,
      plugins: [
        'typescript',
        'jsx',
        'decorators-legacy',
        'classProperties',
        'objectRestSpread',
        'asyncGenerators',
        'dynamicImport',
        'nullishCoalescingOperator',
        'optionalChaining',
      ],
    },
    '.tsx': {
      sourceType: 'module',
      allowImportExportEverywhere: true,
      allowReturnOutsideFunction: true,
      plugins: [
        'typescript',
        'jsx',
        'decorators-legacy',
        'classProperties',
        'objectRestSpread',
        'asyncGenerators',
        'dynamicImport',
        'nullishCoalescingOperator',
        'optionalChaining',
      ],
    },
    '.js': {
      sourceType: 'module',
      allowImportExportEverywhere: true,
      allowReturnOutsideFunction: true,
      plugins: [
        'jsx',
        'decorators-legacy',
        'classProperties',
        'objectRestSpread',
        'asyncGenerators',
        'dynamicImport',
        'nullishCoalescingOperator',
        'optionalChaining',
      ],
    },
    '.jsx': {
      sourceType: 'module',
      allowImportExportEverywhere: true,
      allowReturnOutsideFunction: true,
      plugins: [
        'jsx',
        'decorators-legacy',
        'classProperties',
        'objectRestSpread',
        'asyncGenerators',
        'dynamicImport',
        'nullishCoalescingOperator',
        'optionalChaining',
      ],
    },
  };

  /**
   * 验证代码语法
   */
  static validateSyntax(code: string, fileExtension: string): SyntaxValidationResult {
    const result: SyntaxValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
    };

    try {
      const options = this.PARSER_OPTIONS[fileExtension] || this.PARSER_OPTIONS['.js'];
      
      // 使用 Babel 解析器验证语法
      parse(code, options);
      
      // 进行额外的静态检查
      this.performStaticChecks(code, result);
      
    } catch (error) {
      result.valid = false;
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.errors.push(`语法错误: ${errorMessage}`);
    }

    return result;
  }

  /**
   * 批量验证多个文件
   */
  static validateMultiple(files: Array<{ content: string; filePath: string }>): Record<string, SyntaxValidationResult> {
    const results: Record<string, SyntaxValidationResult> = {};
    
    for (const file of files) {
      const extension = this.getFileExtension(file.filePath);
      results[file.filePath] = this.validateSyntax(file.content, extension);
    }
    
    return results;
  }

  /**
   * 检查是否支持该文件类型
   */
  static isSupported(fileExtension: string): boolean {
    return fileExtension in this.PARSER_OPTIONS;
  }

  /**
   * 获取文件扩展名
   */
  private static getFileExtension(filePath: string): string {
    const match = filePath.match(/\.[^.]*$/);
    return match ? match[0] : '.js';
  }

  /**
   * 执行静态检查
   */
  private static performStaticChecks(code: string, result: SyntaxValidationResult): void {
    // 检查未闭合的括号
    this.checkUnmatchedBrackets(code, result);
    
    // 检查基本的导入/导出语法
    this.checkImportExportSyntax(code, result);
    
    // 检查JSX语法（如果适用）
    if (code.includes('<') && code.includes('>')) {
      this.checkJSXSyntax(code, result);
    }
  }

  /**
   * 检查未匹配的括号
   */
  private static checkUnmatchedBrackets(code: string, result: SyntaxValidationResult): void {
    const brackets = { '(': ')', '[': ']', '{': '}' };
    const stack: string[] = [];
    
    for (let i = 0; i < code.length; i++) {
      const char = code[i];
      
      if (char in brackets) {
        stack.push(char);
      } else if (Object.values(brackets).includes(char)) {
        const last = stack.pop();
        if (!last || brackets[last as keyof typeof brackets] !== char) {
          result.warnings.push(`第 ${i + 1} 个字符处可能存在未匹配的括号: ${char}`);
        }
      }
    }
    
    if (stack.length > 0) {
      result.warnings.push(`发现 ${stack.length} 个未闭合的括号`);
    }
  }

  /**
   * 检查导入/导出语法
   */
  private static checkImportExportSyntax(code: string, result: SyntaxValidationResult): void {
    const importRegex = /import\s+(?:[^;]+\s+from\s+)?['"][^'"]*['"];?/g;
    
    const imports = code.match(importRegex) || [];
    
    // 检查导入语句格式
    for (const importStatement of imports) {
      if (!importStatement.includes('from') && !importStatement.includes('require')) {
        result.warnings.push(`可能的导入语法错误: ${importStatement.trim()}`);
      }
    }
    
    // 提供统计信息
    if (imports.length > 10) {
      result.warnings.push(`文件包含 ${imports.length} 个导入语句，考虑重构以减少依赖`);
    }
  }

  /**
   * 检查JSX语法
   */
  private static checkJSXSyntax(code: string, result: SyntaxValidationResult): void {
    // 基本的JSX标签匹配检查
    const jsxTagRegex = /<(\w+)[^>]*>/g;
    const closingTagRegex = /<\/(\w+)>/g;
    
    const openTags = Array.from(code.matchAll(jsxTagRegex)).map(match => match[1]);
    const closeTags = Array.from(code.matchAll(closingTagRegex)).map(match => match[1]);
    
    // 检查自闭合标签
    const selfClosingRegex = /<\w+[^>]*\/>/g;
    const selfClosingTags = code.match(selfClosingRegex) || [];
    
    if (openTags.length !== closeTags.length + selfClosingTags.length) {
      result.warnings.push('JSX标签可能不匹配，请检查开始和结束标签');
    }
  }

  /**
   * 获取详细的验证报告
   */
  static getValidationReport(results: Record<string, SyntaxValidationResult>): string {
    const report: string[] = ['=== 语法验证报告 ===\n'];
    
    let totalFiles = 0;
    let validFiles = 0;
    let totalErrors = 0;
    let totalWarnings = 0;
    
    for (const [filePath, result] of Object.entries(results)) {
      totalFiles++;
      if (result.valid) validFiles++;
      totalErrors += result.errors.length;
      totalWarnings += result.warnings.length;
      
      if (!result.valid || result.warnings.length > 0) {
        report.push(`\n文件: ${filePath}`);
        report.push(`状态: ${result.valid ? '✅ 有效' : '❌ 无效'}`);
        
        if (result.errors.length > 0) {
          report.push('错误:');
          result.errors.forEach(error => report.push(`  - ${error}`));
        }
        
        if (result.warnings.length > 0) {
          report.push('警告:');
          result.warnings.forEach(warning => report.push(`  - ${warning}`));
        }
      }
    }
    
    report.unshift(`总计: ${totalFiles} 个文件，${validFiles} 个有效，${totalErrors} 个错误，${totalWarnings} 个警告\n`);
    
    return report.join('\n');
  }
}
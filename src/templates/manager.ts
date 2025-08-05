import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import type { TemplateVariables, TemplateResult } from './types.js';

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 模板管理器 - 支持文件系统和扩展性
 */
export class TemplateManager {
  private templateCache = new Map<string, string>();
  private promptsDir: string;

  constructor(customPromptsDir?: string) {
    this.promptsDir = customPromptsDir || path.join(__dirname, 'prompts');
  }

  /**
   * 获取模板内容
   */
  async getTemplate(templateName: string): Promise<string> {
    // 检查缓存
    if (this.templateCache.has(templateName)) {
      return this.templateCache.get(templateName)!;
    }

    // 从文件系统加载
    const templatePath = path.join(this.promptsDir, `${templateName}.md`);
    
    if (!await fs.pathExists(templatePath)) {
      throw new Error(`模板文件不存在: ${templatePath}`);
    }

    const content = await fs.readFile(templatePath, 'utf-8');
    
    // 缓存模板内容
    this.templateCache.set(templateName, content);
    
    return content;
  }

  /**
   * 编译模板
   */
  async compileTemplate(templateName: string, variables: TemplateVariables): Promise<TemplateResult> {
    const template = await this.getTemplate(templateName);
    const prompt = this.replaceVariables(template, variables);
    
    return {
      prompt,
      templateName,
    };
  }

  /**
   * 替换模板变量
   */
  private replaceVariables(template: string, variables: TemplateVariables): string {
    let result = template;
    
    // 替换所有变量
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{${key}}`;
      const replacement = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
      result = result.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), replacement);
    }
    
    return result;
  }

  /**
   * 获取提取模板名称
   */
  getExtractionTemplate(fileExtension: string): string {
    const templateMap: Record<string, string> = {
      '.tsx': 'extraction-react-tsx',
      '.jsx': 'extraction-react-jsx',
      '.ts': 'extraction-typescript',
      '.js': 'extraction-javascript',
      '.vue': 'extraction-vue',
    };
    
    return templateMap[fileExtension] || 'extraction-generic';
  }

  /**
   * 获取翻译模板名称
   */
  getTranslationTemplate(): string {
    return 'translation-batch';
  }

  /**
   * 验证模板是否存在
   */
  async hasTemplate(templateName: string): Promise<boolean> {
    const templatePath = path.join(this.promptsDir, `${templateName}.md`);
    return await fs.pathExists(templatePath);
  }

  /**
   * 获取所有可用模板名称
   */
  async getAvailableTemplates(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.promptsDir);
      return files
        .filter(file => file.endsWith('.md'))
        .map(file => path.basename(file, '.md'));
    } catch (error) {
      console.warn(`无法读取模板目录 ${this.promptsDir}:`, error);
      return [];
    }
  }

  /**
   * 编译翻译模板
   */
  async compileTranslationTemplate(
    textsToTranslate: Record<string, string>,
    locale: string,
    displayLanguage: string
  ): Promise<TemplateResult> {
    const variables: TemplateVariables = {
      locale,
      displayLanguage,
      functionName: '', // 翻译模板不需要
      autoImport: {},   // 翻译模板不需要
      fileContent: '',  // 翻译模板不需要
      textsToTranslate: JSON.stringify(textsToTranslate, null, 2),
    };

    return await this.compileTemplate('translation-batch', variables);
  }

  /**
   * 添加自定义模板
   */
  async addTemplate(templateName: string, templateContent: string): Promise<void> {
    const templatePath = path.join(this.promptsDir, `${templateName}.md`);
    
    // 确保目录存在
    await fs.ensureDir(this.promptsDir);
    
    // 写入模板文件
    await fs.writeFile(templatePath, templateContent, 'utf-8');
    
    // 更新缓存
    this.templateCache.set(templateName, templateContent);
  }

  /**
   * 删除模板
   */
  async removeTemplate(templateName: string): Promise<void> {
    const templatePath = path.join(this.promptsDir, `${templateName}.md`);
    
    if (await fs.pathExists(templatePath)) {
      await fs.remove(templatePath);
    }
    
    // 清除缓存
    this.templateCache.delete(templateName);
  }

  /**
   * 清空模板缓存
   */
  clearCache(): void {
    this.templateCache.clear();
  }

  /**
   * 获取模板目录路径
   */
  getPromptsDir(): string {
    return this.promptsDir;
  }

  /**
   * 设置自定义模板目录
   */
  setPromptsDir(dir: string): void {
    this.promptsDir = dir;
    this.clearCache(); // 清空缓存，强制重新加载
  }

  /**
   * 复制默认模板到指定目录
   */
  async copyDefaultTemplates(targetDir: string): Promise<void> {
    const defaultTemplatesDir = path.join(__dirname, 'prompts');
    
    // 确保目标目录存在
    await fs.ensureDir(targetDir);
    
    // 复制所有模板文件
    await fs.copy(defaultTemplatesDir, targetDir);
    
    console.log(`默认模板已复制到: ${targetDir}`);
  }
}
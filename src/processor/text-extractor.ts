import type { ScanResult } from '../scanner/types.js';
import type { I18nConfig, ExtractionResult } from '../config/types.js';
import type { LLMClient } from '../llm/client.js';
import type { TemplateManager } from '../templates/manager.js';

/**
 * 文本提取器 - 专门负责从文件中提取中文文本
 */
export class TextExtractor {
  constructor(
    private config: I18nConfig,
    private llmClient: LLMClient,
    private templateManager: TemplateManager
  ) {}

  /**
   * 从文件中提取中文文本
   */
  async extractFromFile(
    file: ScanResult,
    fileContent: string
  ): Promise<ExtractionResult> {
    try {
      // 获取模板类型
      const templateType = this.getTemplateType(file);
      
      // 编译提示词
      const templateResult = await this.templateManager.compileTemplate(templateType, {
        locale: this.config.locale,
        displayLanguage: this.config.displayLanguage,
        functionName: this.config.replacement.functionName,
        autoImport: this.config.replacement.autoImport,
        fileContent,
        fileType: file.fileType,
      });

      // 调用LLM提取文本  
      const extractionResult = await this.llmClient.extractTexts(templateResult.prompt);
      
      return extractionResult;
    } catch (error) {
      throw new Error(`文本提取失败 ${file.relativePath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取模板类型
   */
  private getTemplateType(file: ScanResult): string {
    const extension = file.filePath.split('.').pop()?.toLowerCase();
    
    const templateMap: Record<string, string> = {
      'tsx': 'extraction-react-tsx',
      'jsx': 'extraction-react-jsx',
      'ts': 'extraction-typescript',
      'js': 'extraction-javascript',
      'vue': 'extraction-vue',
    };
    
    return templateMap[extension || ''] || 'extraction-generic';
  }

  /**
   * 批量提取文本
   */
  async extractFromFiles(
    files: Array<{ file: ScanResult; content: string }>
  ): Promise<Array<{ file: ScanResult; result: ExtractionResult | null; error?: Error }>> {
    const results = await Promise.allSettled(
      files.map(async ({ file, content }) => ({
        file,
        result: await this.extractFromFile(file, content),
      }))
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          file: files[index].file,
          result: null,
          error: result.reason instanceof Error ? result.reason : new Error(String(result.reason))
        };
      }
    });
  }
}
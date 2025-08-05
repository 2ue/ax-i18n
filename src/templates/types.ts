/**
 * 模板变量
 */
export interface TemplateVariables {
  /** 源语言 */
  locale: string;
  /** 目标语言 */
  displayLanguage: string;
  /** 翻译函数名 */
  functionName: string;
  /** 自动导入配置 */
  autoImport: object;
  /** 文件内容 */
  fileContent: string;
  /** 文件类型（仅通用模板） */
  fileType?: string;
  /** 待翻译文本（仅翻译模板） */
  textsToTranslate?: string;
}

/**
 * 模板结果
 */
export interface TemplateResult {
  /** 编译后的提示词 */
  prompt: string;
  /** 使用的模板名称 */
  templateName: string;
}
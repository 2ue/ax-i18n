/**
 * 配置文件类型定义
 */
export interface I18nConfig {
  /** 源语言 */
  locale: string;
  /** 目标语言 */
  displayLanguage: string;
  /** 输出目录 */
  outputDir: string;
  /** 临时目录，如果设置则不修改源文件 */
  tempDir?: string;
  /** 包含的文件模式 */
  include: string[];
  /** 排除的文件模式 */
  exclude: string[];
  /** Key生成配置 */
  keyGeneration: KeyGenerationConfig;
  /** 替换配置 */
  replacement: ReplacementConfig;
  /** 输出配置 */
  output: OutputConfig;
  /** 日志配置 */
  logging: LoggingConfig;
  /** LLM配置 */
  llm: LLMConfig;
}

/** Key生成配置 */
export interface KeyGenerationConfig {
  /** 中文文本最大长度 */
  maxChineseLength: number;
  /** Hash长度 */
  hashLength: number;
  /** 是否复用已存在的key */
  reuseExistingKey: boolean;
  /** 重复key后缀策略 */
  duplicateKeySuffix: 'hash';
  /** Key前缀 */
  keyPrefix: string;
  /** 分隔符 */
  separator: string;
  /** 拼音选项 */
  pinyinOptions: PinyinOptions;
}

/** 拼音配置选项 */
export interface PinyinOptions {
  /** 声调类型 */
  toneType: 'none' | 'num' | 'symbol';
  /** 输出类型 */
  type: 'string' | 'array';
}

/** 替换配置 */
export interface ReplacementConfig {
  /** 翻译函数名 */
  functionName: string;
  /** 引号类型 */
  quoteType: 'single' | 'double' | 'auto';
  /** 自动导入配置 */
  autoImport: AutoImportConfig;
}

/** 自动导入配置 */
export interface AutoImportConfig {
  /** 是否启用自动导入 */
  enabled: boolean;
  /** 插入位置 */
  insertPosition?: 'top' | 'afterImports' | 'beforeFirstUse';
  /** 导入映射 */
  imports?: Record<string, ImportStatement>;
}

/** 导入语句配置 */
export interface ImportStatement {
  /** 导入语句 */
  importStatement: string;
}

/** 输出配置 */
export interface OutputConfig {
  /** 是否格式化JSON */
  prettyJson: boolean;
  /** 本地化文件名模式 */
  localeFileName: string;
}

/** 日志配置 */
export interface LoggingConfig {
  /** 是否启用日志 */
  enabled: boolean;
  /** 日志级别 */
  level: 'minimal' | 'normal' | 'verbose';
}

/** LLM配置 */
export interface LLMConfig {
  /** 提供者 */
  provider: 'openai' | 'anthropic' | 'azure' | 'gemini' | 'ollama' | 'custom';
  /** API密钥 */
  apiKey?: string;
  /** 基础URL */
  baseURL?: string;
  /** 模型名称 */
  model: string;
  /** 温度 */
  temperature: number;
  /** 最大Token数 */
  maxTokens: number;
  /** 超时时间（毫秒） */
  timeout: number;
  /** 重试次数 */
  retryCount: number;
  /** 提取任务配置 */
  extraction: ExtractionConfig;
  /** 翻译任务配置 */
  translation: TranslationConfig;
}

/** 提取任务配置 */
export interface ExtractionConfig {
  /** 模型名称 */
  model?: string;
  /** 温度 */
  temperature: number;
  /** 最大Token数 */
  maxTokens?: number;
  /** 提示词模板 */
  promptTemplate: string;
}

/** 翻译任务配置 */
export interface TranslationConfig {
  /** 模型名称 */
  model?: string;
  /** 温度 */
  temperature: number;
  /** 最大Token数 */
  maxTokens?: number;
  /** 提示词模板 */
  promptTemplate: string;
  /** 批处理大小 */
  batchSize: number;
}

/** 提取结果 */
export interface ExtractionResult {
  /** 提取的文本映射 */
  extractedTexts: Record<string, string>;
  /** 转换后的代码 */
  transformedCode: string;
}

/** 翻译结果 */
export interface TranslationResult {
  /** 翻译映射 */
  translations: Record<string, string>;
}

/** 处理结果统计 */
export interface ProcessingStats {
  /** 处理的文件数量 */
  filesProcessed: number;
  /** 提取的文本数量 */
  textsExtracted: number;
  /** 翻译的文本数量 */
  textsTranslated: number;
  /** 失败的文件 */
  failedFiles: string[];
  /** 处理时间（毫秒） */
  processingTime: number;
}
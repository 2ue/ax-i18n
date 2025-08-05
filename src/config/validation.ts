import Joi from 'joi';
import type { I18nConfig } from './types.js';

/**
 * 配置验证Schema
 */
const configSchema = Joi.object<I18nConfig>({
  locale: Joi.string().required().description('源语言'),
  displayLanguage: Joi.string().required().description('目标语言'),
  outputDir: Joi.string().required().description('输出目录'),
  tempDir: Joi.string().optional().description('临时目录'),
  include: Joi.array().items(Joi.string()).min(1).required().description('包含的文件模式'),
  exclude: Joi.array().items(Joi.string()).required().description('排除的文件模式'),
  
  keyGeneration: Joi.object({
    maxChineseLength: Joi.number().integer().min(1).required(),
    hashLength: Joi.number().integer().min(4).max(16).required(),
    reuseExistingKey: Joi.boolean().required(),
    duplicateKeySuffix: Joi.string().valid('hash').required(),
    keyPrefix: Joi.string().allow('').required(),
    separator: Joi.string().min(1).required(),
    pinyinOptions: Joi.object({
      toneType: Joi.string().valid('none', 'num', 'symbol').required(),
      type: Joi.string().valid('string', 'array').required(),
    }).required(),
  }).required(),
  
  replacement: Joi.object({
    functionName: Joi.string().min(1).required(),
    quoteType: Joi.string().valid('single', 'double', 'auto').required(),
    autoImport: Joi.object({
      enabled: Joi.boolean().required(),
      insertPosition: Joi.string().valid('top', 'afterImports', 'beforeFirstUse').optional(),
      imports: Joi.object().pattern(Joi.string(), Joi.object({
        importStatement: Joi.string().required(),
      })).optional(),
    }).required(),
  }).required(),
  
  output: Joi.object({
    prettyJson: Joi.boolean().required(),
    localeFileName: Joi.string().min(1).required(),
  }).required(),
  
  logging: Joi.object({
    enabled: Joi.boolean().required(),
    level: Joi.string().valid('minimal', 'normal', 'verbose').required(),
  }).required(),
  
  llm: Joi.object({
    provider: Joi.string().valid('openai', 'anthropic', 'azure', 'gemini', 'ollama', 'custom').required(),
    apiKey: Joi.string().optional(),
    baseURL: Joi.string().uri().optional(),
    model: Joi.string().min(1).required(),
    temperature: Joi.number().min(0).max(2).required(),
    maxTokens: Joi.number().integer().min(1).required(),
    timeout: Joi.number().integer().min(1000).required(),
    retryCount: Joi.number().integer().min(0).required(),
    
    extraction: Joi.object({
      model: Joi.string().optional(),
      temperature: Joi.number().min(0).max(2).required(),
      maxTokens: Joi.number().integer().min(1).optional(),
      promptTemplate: Joi.string().min(1).required(),
    }).required(),
    
    translation: Joi.object({
      model: Joi.string().optional(),
      temperature: Joi.number().min(0).max(2).required(),
      maxTokens: Joi.number().integer().min(1).optional(),
      promptTemplate: Joi.string().min(1).required(),
      batchSize: Joi.number().integer().min(1).max(100).required(),
    }).required(),
  }).required(),
});

/**
 * 验证配置
 */
export function validateConfig(config: unknown): I18nConfig {
  const { error, value } = configSchema.validate(config, {
    abortEarly: false,
    allowUnknown: false,
  });
  
  if (error) {
    throw new Error(`配置验证失败:\n${error.details.map(d => `- ${d.message}`).join('\n')}`);
  }
  
  return value;
}
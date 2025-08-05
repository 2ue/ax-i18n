import type { I18nConfig } from './types.js';

/**
 * 默认配置
 */
export const DEFAULT_CONFIG: I18nConfig = {
  locale: 'zh-CN',
  displayLanguage: 'en-US',
  outputDir: 'src/locales',
  include: [
    'src/**/*.{js,jsx,ts,tsx}',
  ],
  exclude: [
    'node_modules/**',
    'dist/**',
    'build/**',
    '.next/**',
    '**/*.test.{js,jsx,ts,tsx}',
    '**/*.spec.{js,jsx,ts,tsx}',
  ],
  keyGeneration: {
    maxChineseLength: 10,
    hashLength: 6,
    reuseExistingKey: true,
    duplicateKeySuffix: 'hash',
    keyPrefix: '',
    separator: '_',
    pinyinOptions: {
      toneType: 'none',
      type: 'array',
    },
  },
  replacement: {
    functionName: '$t',
    quoteType: 'single',
    autoImport: {
      enabled: false,
    },
  },
  output: {
    prettyJson: true,
    localeFileName: '{locale}.json',
  },
  logging: {
    enabled: true,
    level: 'normal',
  },
  llm: {
    provider: 'openai',
    model: 'gpt-4o-mini',
    temperature: 0.1,
    maxTokens: 4096,
    timeout: 30000,
    retryCount: 3,
    extraction: {
      temperature: 0,
      promptTemplate: 'default',
    },
    translation: {
      temperature: 0.3,
      batchSize: 20,
    },
  },
};

/**
 * 配置文件名
 */
export const CONFIG_FILE_NAMES = [
  'i18n.config.json',
  'i18n.config.js',
  'i18n.config.mjs',
  '.i18nrc.json',
  '.i18nrc.js',
];

/**
 * 支持的文件扩展名到模板的映射
 */
export const FILE_EXTENSION_TO_TEMPLATE: Record<string, string> = {
  '.tsx': 'extraction-react-tsx',
  '.jsx': 'extraction-react-jsx',
  '.ts': 'extraction-typescript',
  '.js': 'extraction-javascript',
  '.vue': 'extraction-vue',
};
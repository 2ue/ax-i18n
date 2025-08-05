# i18n-xy 配置指南

## 目录
- [基础配置](#基础配置)
  - [语言设置](#语言设置)
  - [文件路径配置](#文件路径配置)
- [文件处理配置](#文件处理配置)
  - [包含和排除规则](#包含和排除规则)
- [Key生成配置](#key生成配置)
  - [Key生成策略](#key生成策略)
  - [拼音转换选项](#拼音转换选项)
- [输出配置](#输出配置)
- [替换配置](#替换配置)
- [日志配置](#日志配置)
- [大模型配置](#大模型配置)
- [配置最佳实践](#配置最佳实践)

## 基础配置

说明：
- 所有路径匹配相关的需要符合glob规则，会使用fast-glob包来匹配

### 语言设置

#### `locale`
- **类型**: `string`
- **默认值**: `"zh-CN"`
- **说明**: 指定项目的主要语言，通常是源代码中使用的语言
- **提供给大模型**: ✅ (作为源语言)
- **配置示例**:
  ```json
  {
    "locale": "zh-CN"
  }
  ```
- **效果示例**:
  ```
  📁 locales/
  └── zh-CN.json  // 主语言文件
  {
    "welcome": "欢迎",
    "submit": "提交"
  }
  ```

#### `displayLanguage`
- **类型**: `string`
- **默认值**: `"en-US"`
- **说明**: 指定翻译的语言
- **提供给大模型**: ✅ (作为目标语言)
- **配置示例**:
  ```json
  {
    "displayLanguage": "en-US"
  }
  ```
- **效果示例**:
  ```
  📁 locales/
  ├── zh-CN.json  // 主语言文件
  └── en-US.json  // 翻译后的语言文件
  {
    "welcome": "Welcome",
    "submit": "Submit"
  }
  ```

### 文件路径配置

#### `outputDir`
- **类型**: `string`
- **默认值**: `"src/locales"`
- **说明**: 指定生成的语言文件存放目录
- **配置示例**:
  ```json
  {
    "outputDir": "src/locales"
  }
  ```
- **效果示例**:
  ```
  📁 项目结构
  src/
  ├── locales/              // 输出目录
  │   ├── zh-CN.json       // 中文翻译
  │   └── en-US.json       // 英文翻译
  ├── components/
  └── pages/
  ```

#### `tempDir`
- **类型**: `string`
- **默认值**: `undefined`
- **说明**: 指定处理后不会改变源文件，而是将原文件转换后按原始路径存放到临时存放目录
- **配置示例**:
  ```json
  {
    "include": [
      "src/**/*.{js,ts,ts,tsx}",
    ],
    "tempDir": "./temp"
  }
  ```
- **效果示例**:
  ```
  📁 项目结构
  src/
  ├── components/
  │   └── Button.tsx       // 原始文件
  └── pages/
      └── index.tsx        // 原始文件
  
  temp/                   // 临时目录
  └── components/
      │   └── Button.tsx  // 处理后的文件
      └── pages/
          └── index.tsx   // 处理后的文件
  
  // 原始文件 Button.tsx
  const Button = () => <button>点击提交</button>
  
  // 临时目录中的 Button.tsx
  const Button = () => <button>{t('dian_ji_ti_jiao')}</button>
  ```

## 文件处理配置

### 包含和排除规则

#### `include`
- **类型**: `string[]`
- **默认值**: 
  ```json
  [
    "src/**/*.{js,jsx,ts,tsx}",
  ]
  ```
- **说明**: 指定需要处理的文件匹配模式
- **配置示例**:
  ```json
  {
    "include": [
      "src/**/*.{js,ts,ts,tsx}"
    ]
  }
  ```
- **效果示例**:
  ```
  📁 项目结构
  src/
  ├── utils/
  │   ├── helper.js        ✅ 会被处理
  │   └── constants.ts     ✅ 会被处理
  ├── components/
  │   ├── Button.tsx      ✅ 会被处理
  │   └── Button.css      ❌ 不会被处理
  └── pages/
      ├── index.jsx       ❌ 不会被处理（不在include中）
      └── about.tsx       ❌ 不会被处理（不在include中）
  ```

#### `exclude`
- **类型**: `string[]`
- **默认值**:
  ```json
  [
    "node_modules/**",
    "dist/**",
    "build/**",
    ".next/**",
    "**/*.test.{js,jsx,ts,tsx}",
    "**/*.spec.{js,jsx,ts,tsx}"
  ]
  ```
- **说明**: 指定不需要处理的文件匹配模式
- **效果示例**:
  ```json
  {
    "exclude": [
      "**/node_modules/**",  // 排除所有 node_modules 目录
      "src/**/*.test.*",     // 排除测试文件
      "**/*.d.ts"           // 排除类型声明文件
    ]
  }
  ```
- **注意事项**:
  - exclude 的优先级高于 include
  - 建议排除测试文件、构建输出和第三方库

## Key生成配置

### Key生成策略

#### `keyGeneration`

##### `maxChineseLength`
- **类型**: `number`
- **默认值**: `10`
- **说明**: 用于生成key时截取的中文文本最大长度
- **配置示例**:
  ```json
  {
    "keyGeneration": {
      "maxChineseLength": 5
    }
  }
  ```
- **效果示例**:
  ```
  原始文本 -> 生成的key
  "提交" -> "ti_jiao"
  "这是一个很长的文本" -> "zhe_shi_yi_ge_hen_hash123"  // 超过5个字符，添加hash
  "用户管理配置页面" -> "yong_hu_guan_li_hash456"      // 截取前5个字符
  ```

##### `hashLength`
- **类型**: `number`
- **默认值**: `6`
- **说明**: 当key重复时添加的hash后缀长度
- **配置示例**:
  ```json
  {
    "keyGeneration": {
      "hashLength": 4
    }
  }
  ```
- **效果示例**:
  ```
  场景1：两处都使用了"提交"文本
  
  // 第一次遇到
  "提交" -> "ti_jiao"
  
  // 第二次遇到（假设reuseExistingKey为false）
  "提交" -> "ti_jiao_a1b2"  // 4位hash后缀

  场景2：文本超长
  
  "这是一个很长的文本" -> "zhe_shi_yi_ge_hen_he2f"  // 超过5个字符，添加hash
  ```

##### `reuseExistingKey`
- **类型**: `boolean`
- **默认值**: `true`
- **说明**: 相同文本是否使用相同的key
- **配置示例**:
  ```json
  {
    "keyGeneration": {
      "reuseExistingKey": true
    }
  }
  ```
- **效果示例**:
  ```typescript
  // 源代码
  function Page() {
    return (
      <>
        <button>提交</button>
        <div>
          <button>提交</button>
        </div>
      </>
    )
  }
  
  // reuseExistingKey: true
  function Page() {
    return (
      <>
        <button>{t('ti_jiao')}</button>
        <div>
          <button>{t('ti_jiao')}</button>  // 复用相同的key
        </div>
      </>
    )
  }
  
  // reuseExistingKey: false
  function Page() {
    return (
      <>
        <button>{t('ti_jiao')}</button>
        <div>
          <button>{t('ti_jiao_a1b2')}</button>  // 生成新的key
        </div>
      </>
    )
  }
  ```

##### `duplicateKeySuffix`
- **类型**: `"hash"`
- **默认值**: `"hash"`
- **说明**: 处理重复key的策略
- **效果示例**:
  当 `reuseExistingKey` 为 `false` 时，相同文本会生成不同的key：
  ```
  "欢迎" -> welcome_a1b2c3
  "欢迎" -> welcome_d4e5f6
  ```

##### `keyPrefix`
- **类型**: `string`
- **默认值**: `""`
- **说明**: 生成的key的前缀
- **提供给大模型**: ✅ (用于key生成规则)
- **配置示例**:
  ```json
  {
    "keyGeneration": {
      "keyPrefix": "user"
    }
  }
  ```
- **效果示例**:
  ```typescript
  // 源代码
  const UserProfile = () => (
    <div>
      <h1>用户信息</h1>
      <button>保存</button>
    </div>
  )
  
  // 转换后
  const UserProfile = () => (
    <div>
      <h1>{t('user_yong_hu_xin_xi')}</h1>
      <button>{t('user_bao_cun')}</button>
    </div>
  )
  
  // 生成的语言文件
  {
    "user_yong_hu_xin_xi": "用户信息",
    "user_bao_cun": "保存"
  }
  ```

##### `separator`
- **类型**: `string`
- **默认值**: `"_"`
- **说明**: key中用于连接的分隔符
- **提供给大模型**: ✅ (用于key生成规则)
- **配置示例**:
  ```json
  {
    "keyGeneration": {
      "separator": ".",
      "keyPrefix": "user"
    }
  }
  ```
- **效果示例**:
  ```typescript
  // 源代码
  const label = "用户名称";
  
  // separator: "_" （默认）
  t('user_yong_hu_ming_cheng')
  
  // separator: "."
  t('user.yong.hu.ming.cheng')
  
  // separator: "-"
  t('user-yong-hu-ming-cheng')
  ```

### 拼音转换选项

#### `pinyinOptions`
- **类型**: `object`
- **默认配置**:
  ```json
  {
    "toneType": "none",
    "type": "array"
  }
  ```
- **说明**: 控制中文转拼音的行为，使用pinyin-pro来实现
- **效果示例**:
  ```typescript
  // 原文本: "用户设置"
  
  // toneType: "none", type: "array"
  ["yong", "hu", "she", "zhi"] -> "yong_hu_she_zhi"
  
  // toneType: "num", type: "array"
  ["yong4", "hu4", "she4", "zhi4"] -> "yong4_hu4_she4_zhi4"
  
  // toneType: "symbol", type: "array"
  ["yòng", "hù", "shè", "zhì"] -> "yòng_hù_shè_zhì"
  
  // type: "string"
  "yonghushezhi"
  ```

## 输出配置

#### `output`

##### `prettyJson`
- **类型**: `boolean`
- **默认值**: `true`
- **说明**: 是否格式化输出的JSON文件
- **效果示例**:
  ```json
  {
    "output": {
      "prettyJson": true
    }
  }
  ```
  生成的JSON文件会有适当的缩进和换行

##### `localeFileName`
- **类型**: `string`
- **默认值**: `"{locale}.json"`
- **说明**: 语言文件的命名模式
- **效果示例**:
  ```json
  {
    "output": {
      "localeFileName": "i18n-{locale}.json"
    }
  }
  ```
  生成的文件名会是 `i18n-zh-CN.json`

## 替换配置

#### `replacement`

##### `functionName`
- **类型**: `string`
- **默认值**: `"$t"`
- **说明**: 替换中文字符串时使用的函数名
- **提供给大模型**: ✅ (用于代码替换格式)
- **配置示例**:
  ```json
  {
    "replacement": {
      "functionName": "$t"
    }
  }
  ```
- **效果示例**:
  ```typescript
  // 源代码
  const title = "欢迎使用";
  const message = "请输入用户名";
  
  // functionName: "$t"
  const title = $t('huan_ying_shi_yong');
  const message = $t('qing_shu_ru_yong_hu_ming');
  
  // functionName: "t"
  const title = t('huan_ying_shi_yong');
  const message = t('qing_shu_ru_yong_hu_ming');
  
  // functionName: "i18n.t"
  const title = i18n.t('huan_ying_shi_yong');
  const message = i18n.t('qing_shu_ru_yong_hu_ming');
  ```

##### `quoteType`
- **类型**: `"single" | "double" | "auto"`
- **默认值**: `"single"`
- **说明**: 强制替换后的字符串使用的引号类型，如果设置为auto，则自动根据当前格式来处理
- **效果示例**:
  ```json
  {
    "replacement": {
      "quoteType": "single"
    }
  }
  ```
  生成的代码会使用单引号：`t('welcome')`

##### `autoImport`
- **类型**: `object`
- **默认值**: `{ enabled: false }`
- **说明**: 控制是否自动添加翻译函数的导入语句
- **配置示例**:
  ```json
  {
    "replacement": {
      "autoImport": {
        "enabled": true,
        "insertPosition": "afterImports",
        "imports": {
          "**/*.tsx": {
            "importStatement": "import { useTranslation } from 'react-i18next';\nconst { t } = useTranslation();"
          }
        }
      }
    }
  }
  ```
- **效果示例**:
  ```typescript
  // 源代码
  import React from 'react';
  import { Button } from './Button';
  
  const Page = () => (
    <div>欢迎</div>
  );
  
  // 转换后
  import React from 'react';
  import { Button } from './Button';
  import { useTranslation } from 'react-i18next';
  const { t } = useTranslation();
  
  const Page = () => (
    <div>{t('huan_ying')}</div>
  );
  ```

## 日志配置

#### `logging`
- **类型**: `object`
- **默认配置**:
  ```json
  {
    "enabled": true,
    "level": "normal"
  }
  ```
- **说明**: 控制工具运行时的日志输出
- **日志级别**:
  - `"minimal"`: 只显示错误和警告
  - `"normal"`: 显示基本处理信息
  - `"verbose"`: 显示详细调试信息

## 大模型配置

### `llm`
- **类型**: `object`
- **说明**: 配置大模型相关设置，用于文本提取和翻译任务

#### `provider`
- **类型**: `"openai" | "anthropic" | "azure" | "gemini" | "ollama" | "custom"`
- **默认值**: `"openai"`
- **说明**: 指定使用的大模型服务提供商
- **配置示例**:
  ```json
  {
    "llm": {
      "provider": "openai"
    }
  }
  ```

#### `apiKey`
- **类型**: `string`
- **默认值**: `undefined`
- **说明**: API密钥，可通过环境变量 `LLM_API_KEY` 设置
- **配置示例**:
  ```json
  {
    "llm": {
      "apiKey": "sk-xxx"
    }
  }
  ```

#### `baseURL`
- **类型**: `string`
- **默认值**: 根据provider自动设置
- **说明**: API基础URL，用于自定义端点或ollama服务
- **配置示例**:
  ```json
  {
    "llm": {
      "provider": "ollama",
      "baseURL": "http://localhost:11434"
    }
  }
  ```

#### `model`
- **类型**: `string`
- **默认值**: 根据provider自动设置
- **说明**: 使用的模型名称
- **配置示例**:
  ```json
  {
    "llm": {
      "provider": "openai",
      "model": "gpt-4o-mini"
    }
  }
  ```
- **常用模型**:
  - OpenAI: `gpt-4o`, `gpt-4o-mini`, `gpt-3.5-turbo`
  - Anthropic: `claude-3-5-sonnet-20241022`, `claude-3-haiku-20240307`
  - Gemini: `gemini-1.5-pro`, `gemini-1.5-flash`
  - Ollama: `llama3.1`, `qwen2.5`, `deepseek-coder`

#### `temperature`
- **类型**: `number`
- **默认值**: `0.1`
- **说明**: 控制模型输出的随机性，0-1之间，越低越确定
- **配置示例**:
  ```json
  {
    "llm": {
      "temperature": 0.1
    }
  }
  ```

#### `maxTokens`
- **类型**: `number`
- **默认值**: `4096`
- **说明**: 单次请求的最大token数量
- **配置示例**:
  ```json
  {
    "llm": {
      "maxTokens": 8192
    }
  }
  ```

#### `timeout`
- **类型**: `number`
- **默认值**: `30000`
- **说明**: 请求超时时间（毫秒）
- **配置示例**:
  ```json
  {
    "llm": {
      "timeout": 60000
    }
  }
  ```

#### `retryCount`
- **类型**: `number`
- **默认值**: `3`
- **说明**: 请求失败时的重试次数
- **配置示例**:
  ```json
  {
    "llm": {
      "retryCount": 5
    }
  }
  ```

#### `extraction`
- **类型**: `object`
- **说明**: 文本提取任务的专用配置
- **配置示例**:
  ```json
  {
    "llm": {
      "extraction": {
        "model": "gpt-4o-mini",
        "temperature": 0,
        "maxTokens": 4096,
        "promptTemplate": "custom-extraction-template"
      }
    }
  }
  ```

##### `extraction.model`
- **类型**: `string`
- **默认值**: 继承父级 `model`
- **说明**: 文本提取任务使用的模型，可与翻译任务使用不同模型
- **提供给提示词**: ❌

##### `extraction.temperature`
- **类型**: `number`
- **默认值**: `0`
- **说明**: 文本提取任务的温度设置，建议使用0确保输出稳定
- **提供给提示词**: ❌

##### `extraction.maxTokens`
- **类型**: `number`
- **默认值**: 继承父级 `maxTokens`
- **说明**: 文本提取任务的最大token数
- **提供给提示词**: ❌

##### `extraction.promptTemplate`
- **类型**: `string`
- **默认值**: `"default"`
- **说明**: 文本提取使用的提示词模板名称
- **提供给提示词**: ✅ (用于选择模板)

#### `translation`
- **类型**: `object`
- **说明**: 翻译任务的专用配置
- **配置示例**:
  ```json
  {
    "llm": {
      "translation": {
        "model": "gpt-4o",
        "temperature": 0.3,
        "maxTokens": 8192,
        "promptTemplate": "professional-translation",
        "batchSize": 50
      }
    }
  }
  ```

##### `translation.model`
- **类型**: `string`
- **默认值**: 继承父级 `model`
- **说明**: 翻译任务使用的模型
- **提供给提示词**: ❌

##### `translation.temperature`
- **类型**: `number`
- **默认值**: `0.3`
- **说明**: 翻译任务的温度设置，适当的随机性有助于翻译质量
- **提供给提示词**: ❌

##### `translation.maxTokens`
- **类型**: `number`
- **默认值**: 继承父级 `maxTokens`
- **说明**: 翻译任务的最大token数
- **提供给提示词**: ❌

##### `translation.promptTemplate`
- **类型**: `string`
- **默认值**: `"default"`
- **说明**: 翻译使用的提示词模板名称
- **提供给提示词**: ✅ (用于选择模板)

##### `translation.batchSize`
- **类型**: `number`
- **默认值**: `20`
- **说明**: 批量翻译时每批处理的条目数量
- **提供给提示词**: ✅ (影响批量处理逻辑)



### 完整配置示例

#### OpenAI配置
```json
{
  "llm": {
    "provider": "openai",
    "apiKey": "sk-xxx",
    "model": "gpt-4o-mini",
    "temperature": 0.1,
    "maxTokens": 4096,
    "extraction": {
      "temperature": 0,
      "promptTemplate": "react-extraction"
    },
    "translation": {
      "model": "gpt-4o",
      "temperature": 0.3,
      "batchSize": 30
    },

  }
}
```

#### Ollama配置
```json
{
  "llm": {
    "provider": "ollama",
    "baseURL": "http://localhost:11434",
    "model": "qwen2.5:14b",
    "temperature": 0.1,
    "maxTokens": 8192,
    "timeout": 120000,
    "extraction": {
      "model": "deepseek-coder:6.7b",
      "temperature": 0
    },
    "translation": {
      "model": "qwen2.5:14b",
      "temperature": 0.2,
      "batchSize": 15
    }
  }
}
```

#### Azure OpenAI配置
```json
{
  "llm": {
    "provider": "azure",
    "apiKey": "xxx",
    "baseURL": "https://your-resource.openai.azure.com",
    "model": "gpt-4o",
    "temperature": 0.1,

  }
}
```

## 配置最佳实践

1. **开发环境配置建议**:
   ```json
   {
     "tempDir": "temp",
     "logging": {
       "level": "verbose"
     }
   }
   ```

2. **生产环境配置建议**:
   ```json
   {
     "logging": {
       "level": "minimal"
     }
   }
   ```
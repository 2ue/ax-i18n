# AI-i18n

AI驱动的国际化(i18n)处理工具，使用大语言模型自动提取代码中的中文文本并替换为国际化函数调用，同时进行文本翻译。

## 功能特性

- 🤖 **AI驱动**: 使用大语言模型智能识别和提取中文文本
- 📁 **多文件类型支持**: 支持 React (.tsx/.jsx)、TypeScript (.ts)、JavaScript (.js)、Vue (.vue) 等
- 🔑 **智能Key生成**: 自动将中文转换为拼音key，支持前缀、分隔符等配置
- 🌐 **自动翻译**: 批量翻译提取的文本到目标语言
- 📦 **自动导入**: 根据文件类型自动添加i18n相关的import语句
- ⚙️ **灵活配置**: 支持多种LLM提供者(OpenAI、Anthropic、Ollama等)
- 🛡️ **安全处理**: 支持临时目录模式，不修改原始文件

## 安装

```bash
npm install -g ai-i18n
```

## 快速开始

### 1. 初始化配置

```bash
ai-i18n init
```

这将在当前目录创建 `i18n.config.json` 配置文件。

### 2. 配置LLM

编辑配置文件，设置你的LLM提供者和API密钥：

```json
{
  "llm": {
    "provider": "openai",
    "apiKey": "your-api-key",
    "model": "gpt-4o-mini"
  }
}
```

或通过环境变量设置：

```bash
export OPENAI_API_KEY="your-api-key"
```

### 3. 扫描和分析项目

```bash
# 基础扫描
ai-i18n scan

# 深度分析项目i18n状态
ai-i18n scan --analyze

# 详细输出，包含文件内容分析
ai-i18n scan --analyze --verbose
```

scan命令会提供：
- 📊 文件类型统计
- ✅ 可处理文件数量
- 🔍 项目i18n状态分析（使用--analyze）
- 💡 个性化处理建议
- 📋 文件样本内容分析

### 4. 处理文件

```bash
ai-i18n process
```

开始提取和翻译文本。

## 配置说明

完整的配置选项请参考[配置文档](docs/config.md)。

主要配置项：

- `locale`: 源语言 (默认: "zh-CN")
- `displayLanguage`: 目标语言 (默认: "en-US")  
- `outputDir`: 本地化文件输出目录 (默认: "src/locales")
- `tempDir`: 临时目录，设置后不会修改源文件
- `include`: 包含的文件模式
- `exclude`: 排除的文件模式
- `llm`: LLM配置

## CLI命令

### `ai-i18n init`

初始化配置文件。

选项：
- `-o, --output <path>`: 配置文件输出路径 (默认: i18n.config.json)

### `ai-i18n scan`

扫描项目文件并分析i18n状态。

选项：
- `-c, --config <path>`: 配置文件路径
- `--verbose`: 详细输出
- `--analyze`: 深度分析文件内容和项目状态
- `--sample <number>`: 分析文件样本数量 (默认: 20)

功能：
- 📊 文件类型统计
- ✅ 可处理文件识别  
- 🔍 项目i18n现状分析
- 💡 个性化处理建议
- 📋 中文文本预览

### `ai-i18n process`

处理文件，提取和翻译文本。

选项：
- `-c, --config <path>`: 配置文件路径
- `--dry-run`: 试运行，不实际修改文件
- `--skip-translation`: 跳过翻译步骤

### `ai-i18n validate`

验证配置文件。

选项：
- `-c, --config <path>`: 配置文件路径

## 支持的文件类型

- **React TypeScript** (.tsx): JSX组件、Hooks、TypeScript类型
- **React JavaScript** (.jsx): JSX组件
- **TypeScript** (.ts): 接口、枚举、装饰器等
- **JavaScript** (.js): ES6+语法
- **Vue** (.vue): 单文件组件
- **通用文件**: JSON、配置文件等

## 处理示例

### 输入 (React TSX)

```tsx
function Welcome({ user }) {
  return (
    <div>
      <h1>欢迎使用我们的应用</h1>
      <p>你好，{user.name}!</p>
      <button onClick={() => alert('保存成功')}>保存</button>
    </div>
  );
}
```

### 输出

```tsx
import { useTranslation } from 'react-i18next';

function Welcome({ user }) {
  const { $t } = useTranslation();
  
  return (
    <div>
      <h1>{$t('huan_ying_shi_yong_wo_men_de_ying_yong')}</h1>
      <p>{$t('ni_hao_name', { name: user.name })}</p>
      <button onClick={() => alert($t('bao_cun_cheng_gong'))}>{$t('bao_cun')}</button>
    </div>
  );
}
```

### 生成的本地化文件

**zh-CN.json:**
```json
{
  "huan_ying_shi_yong_wo_men_de_ying_yong": "欢迎使用我们的应用",
  "ni_hao_name": "你好，{{name}}!",
  "bao_cun_cheng_gong": "保存成功",
  "bao_cun": "保存"
}
```

**en-US.json:**
```json
{
  "huan_ying_shi_yong_wo_men_de_ying_yong": "Welcome to our application",
  "ni_hao_name": "Hello, {{name}}!",
  "bao_cun_cheng_gong": "Save successful",
  "bao_cun": "Save"
}
```

## 开发

### 构建

```bash
npm run build
```

### 测试

```bash
npm test
```

### 开发模式

```bash
npm run dev
```

## 许可证

MIT
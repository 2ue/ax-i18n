# i18n-xy 提示词模板说明

## 模板概述

本目录包含了 i18n-xy 工具使用的所有提示词模板，用于指导大模型进行文本提取和翻译任务。

## 模板分类

### 文本提取模板 (Extraction Templates)

#### 1. extraction-react-tsx.md
- **用途**: 处理 React TypeScript (.tsx) 文件
- **特点**: 
  - 支持 JSX 语法和 TypeScript 类型
  - 处理 React Hooks、组件状态
  - 支持复杂的 JSX 结构和条件渲染
  - 处理事件处理函数和表单验证
  - 自动导入 react-i18next 等库

#### 2. extraction-react-jsx.md
- **用途**: 处理 React JavaScript (.jsx) 文件
- **特点**:
  - 专注于 JSX 语法处理
  - 支持动态内容和列表渲染
  - 处理组件属性和事件处理
  - 适用于纯 JavaScript React 项目
  - 支持自动导入配置

#### 3. extraction-typescript.md
- **用途**: 处理 TypeScript (.ts) 文件
- **特点**:
  - 支持 TypeScript 特有语法
  - 处理接口、枚举、装饰器
  - 支持泛型约束和类型定义
  - 谨慎处理字符串字面量类型
  - 支持模块化导入配置

#### 4. extraction-javascript.md
- **用途**: 处理 JavaScript (.js) 文件
- **特点**:
  - 处理基础 JavaScript 语法
  - 支持 ES6+ 特性
  - 处理异步操作和 Promise
  - 支持模块导入导出
  - CommonJS 和 ES Module 导入支持

#### 5. extraction-vue.md
- **用途**: 处理 Vue (.vue) 文件
- **特点**:
  - 支持 Vue 2 和 Vue 3 语法
  - 处理模板、脚本、样式三个部分
  - 支持 Composition API 和 Options API
  - 处理 Vue 指令和插值表达式
  - 支持 vue-i18n 自动导入

#### 6. extraction-generic.md
- **用途**: 处理通用文件类型
- **特点**:
  - 支持多种文件格式 (JSON, HTML, XML, YAML等)
  - 通用的文本识别和替换规则
  - 灵活的配置支持
  - 适用于不常见的文件类型
  - 保守的处理策略

### 翻译模板 (Translation Templates)

#### 1. translation-batch.md
- **用途**: 批量翻译提取的文本
- **特点**:
  - 支持多种翻译风格
  - 考虑上下文和使用场景
  - 保持翻译一致性
  - 适合软件界面翻译

## 模板使用方式

### 1. 变量替换
每个模板都包含配置变量，在使用时会被实际配置值替换：

```
{locale} → 源语言 (如: zh-CN)
{displayLanguage} → 目标语言 (如: en-US)
{functionName} → 翻译函数名 (如: $t)
{autoImport} → 自动导入配置对象
{fileContent} → 待处理的文件内容
{fileType} → 文件类型 (仅通用模板使用)
```

**注意**: 不再传递 keyPrefix 和 separator，因为最终的key生成在大模型外部处理。

### 2. 模板选择逻辑
根据文件扩展名自动选择对应模板：

```javascript
const templateMap = {
  '.tsx': 'extraction-react-tsx',
  '.jsx': 'extraction-react-jsx', 
  '.ts': 'extraction-typescript',
  '.js': 'extraction-javascript',
  '.vue': 'extraction-vue',
  // 其他文件类型使用通用模板
  'default': 'extraction-generic'
};
```

### 3. 输出格式
所有提取模板都要求返回统一的 JSON 格式：

```json
{
  "extractedTexts": {
    "__I18N_1__": "原始中文文本1",
    "__I18N_2__": "原始中文文本2"
  },
  "transformedCode": "完整的转换后代码内容"
}
```

**临时Key规则**: 使用 `__I18N_${序号}__` 格式，从1开始递增，确保唯一性。

翻译模板返回格式：

```json
{
  "translations": {
    "key1": "Translated text 1",
    "key2": "Translated text 2"
  }
}
```

## 模板特性

### 1. 专业性
- 每个模板都针对特定文件类型优化
- 包含详细的处理规则和示例
- 考虑了各种边界情况和特殊场景

### 2. 约束性
- 明确定义了处理范围和不处理的内容
- 严格的输出格式要求
- 详细的质量检查标准

### 3. 目的性强
- 每个模板都有明确的任务目标
- 针对性的处理规则
- 具体的转换示例

### 4. 配置驱动
- 支持配置参数动态调整行为
- 灵活的模板变量系统
- 可根据项目需求定制

## 扩展指南

### 添加新模板
1. 在 `docs/templates/` 目录下创建新的模板文件
2. 遵循现有模板的结构和格式
3. 包含必要的配置变量和处理规则
4. 提供详细的示例和说明

### 修改现有模板
1. 保持输出格式的一致性
2. 确保向后兼容性
3. 更新相关文档和示例
4. 进行充分的测试验证

## 最佳实践

### 1. 模板设计
- 保持模板的简洁性和可读性
- 提供充分的示例和说明
- 考虑各种边界情况
- 确保输出格式的一致性

### 2. 变量使用
- 合理使用配置变量
- 提供默认值和验证
- 确保变量替换的正确性
- 避免变量冲突

### 3. 质量控制
- 定期审查和更新模板
- 收集用户反馈进行优化
- 进行充分的测试验证
- 保持文档的及时更新
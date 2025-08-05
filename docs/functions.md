# i18n-xy 功能详细设计

## 核心流程

### 1. 配置初始化
- 读取配置文件（默认 `i18n.config.json`）
- 合并默认配置与用户配置
- 验证配置有效性（必填项、路径存在性、大模型连接等）
- 初始化大模型客户端
- 创建输出目录和临时目录（如果有设置）

### 2. 文件扫描与过滤
- 使用 `fast-glob` 根据 `include` 模式扫描文件
- 应用 `exclude` 规则过滤文件（exclude 优先级高于 include）
- 按文件扩展名分类（.js/.jsx/.ts/.tsx 等）
- 生成待处理文件列表

### 3. 文件处理循环
对每个文件执行以下步骤：

#### 3.1 文件内容读取
- 读取源文件内容
- 检测文件编码
- 解析文件类型（根据扩展名）

#### 3.2 提示词生成
- 根据文件类型选择提示词模板
- 填充配置参数到模板：
  - `locale` (源语言)
  - `functionName` (替换函数名)
  - `autoImport` (i18n工具自动引入设置)
  - 文件类型特定提示
- 拼接完整提示词

#### 3.3 大模型调用（文本提取）
使用langchain node版本来处理，需要支持主流大模型和ollama服务
- 发送提示词 + 文件内容到大模型
- 使用 `extraction` 配置（baseUrl, token, model、temperature=0、maxTokens等）
- 重试机制（根据 `retryCount`）
- 超时控制（根据 `timeout`）

#### 3.4 结果解析与验证
- 解析大模型返回的JSON结构：
  ```json
  {
    "extractedTexts": {
      "key1": "中文文本1",
      "key2": "中文文本2"
    },
    "transformedCode": "替换后的完整文件内容"
  }
  ```
- 验证返回格式正确性
- 检查key命名规范
- 验证代码语法正确性

#### 3.5 文件写入
使用fs-extra+fast-glob来处理
根据配置决定写入策略：
- 如果配置了 `tempDir`：写入到临时目录对应路径
- 否则：直接覆盖源文件
- 保持原文件权限和编码

### 4. 语言文件合并
- 收集所有文件提取的文本
- 处理key冲突：
  - 如果 `reuseExistingKey=true`：相同文本复用key
  - 如果 `reuseExistingKey=false`：添加hash后缀
- 生成主语言文件（locale.json）

### 5. 翻译处理

#### 5.1 批量翻译
- 根据 `translation.batchSize` 分批处理
- 构建翻译提示词（包含源语言、目标语言信息）
- 调用大模型翻译API

#### 5.2 翻译结果处理
- 解析翻译结果
- 验证翻译完整性（确保所有key都有对应翻译）
- 生成目标语言文件（displayLanguage.json）

#### 5.3 文件输出
- 根据 `output.localeFileName` 模式命名文件
- 根据 `output.prettyJson` 决定格式化
- 写入到 `outputDir` 目录

## 关键算法

### Key生成算法
```
function generateKey(text, config) {
  // 1. 中文转拼音
  let pinyin = convertToPinyin(text, config.pinyinOptions)
  
  // 2. 截取长度
  if (pinyin.length > config.maxChineseLength) {
    pinyin = pinyin.substring(0, config.maxChineseLength)
    // 添加hash避免冲突
    pinyin += '_' + generateHash(text, config.hashLength)
  }
  
  // 3. 添加前缀和分隔符
  let key = config.keyPrefix ? 
    config.keyPrefix + config.separator + pinyin : 
    pinyin
  
  // 4. 处理重复key
  if (!config.reuseExistingKey && keyExists(key)) {
    key += config.separator + generateHash(text + Date.now(), config.hashLength)
  }
  
  return key
}
```

### 提示词模板系统
```
templates = {
  'react-tsx': `
你是一个专业的国际化工具，请处理以下React TypeScript文件：

配置信息：
- 源语言：{locale}
- 替换函数：{functionName}
- Key前缀：{keyPrefix}
- Key分隔符：{separator}

要求：
1. 提取所有中文字符串
2. 生成符合规范的key
3. 替换为{functionName}('key')格式
4. 保持代码结构和格式不变

文件内容：
{fileContent}

请返回JSON格式：
{
  "extractedTexts": {"key": "中文文本"},
  "transformedCode": "完整的替换后代码"
}
  `,
  
  'javascript': `类似模板，针对JS文件优化`,
  'typescript': `类似模板，针对TS文件优化`
}
```

## 错误处理机制

### 1. 配置验证错误
- 必填字段缺失
- 路径不存在
- 大模型连接失败
- 输出：详细错误信息，终止执行

### 2. 文件处理错误
- 文件读取失败：跳过该文件，记录警告
- 编码问题：尝试多种编码，失败则跳过
- 语法错误：保留原文件，记录错误

### 3. 大模型调用错误
- 网络超时：根据 `retryCount` 重试
- API限制：延迟重试
- 返回格式错误：记录错误，跳过该文件
- Token超限：分块处理或跳过

### 4. 翻译错误
- 部分翻译失败：保留原文，记录警告
- 批量翻译中断：从断点继续
- 格式验证失败：使用原文作为翻译

## 性能优化

### 1. 并发处理
- 文件处理：并发读取和处理（限制并发数）
- 大模型调用：控制并发请求数避免限流
- 翻译任务：批量处理减少API调用

### 2. 缓存机制
- 相同文本的key生成结果缓存
- 大模型响应缓存（基于文件内容hash）
- 翻译结果缓存

### 3. 增量处理
- 文件变更检测（基于修改时间或hash）
- 只处理变更的文件
- 增量更新语言文件

## 质量保证

### 1. 代码完整性检查
- 语法验证：确保替换后代码可编译
- 引用检查：确保所有key都在语言文件中
- 格式保持：保持原有代码风格

### 2. 翻译质量检查
- 完整性：确保所有key都有翻译
- 一致性：相同原文的翻译保持一致
- 格式验证：检查特殊字符和占位符

### 3. 回滚机制
- 处理前备份原文件
- 支持回滚到处理前状态
- 错误时自动恢复

## 扩展性设计

### 1. 插件系统
- 自定义提示词模板
- 自定义key生成策略
- 自定义文件处理器

### 2. 多语言支持
- 支持多个目标语言同时翻译
- 语言特定的处理规则
- 区域化配置

### 3. 集成能力
- CLI工具
- VS Code插件
- CI/CD集成
- Webpack/Vite插件

## 监控与日志

### 1. 处理进度
- 文件处理进度条
- 实时状态显示
- 错误统计

### 2. 详细日志
- 文件级别的处理日志
- 大模型调用日志
- 性能指标记录

### 3. 报告生成
- 处理结果摘要
- 错误详情报告
- 性能分析报告
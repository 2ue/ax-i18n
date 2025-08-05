# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an AI-powered i18n (internationalization) processing tool that converts existing projects into internationalized projects. The tool uses large language models (LLMs) to extract Chinese text from code files and replace them with internationalization function calls, then translates the extracted text to target languages.

## Core Architecture

### Main Processing Flow

1. **Configuration Initialization** - Reads config file (`i18n.config.json`), merges defaults, validates settings, initializes LLM client
2. **File Scanning & Filtering** - Uses `fast-glob` to match files based on include/exclude patterns, categorizes by file type
3. **Text Extraction** - Uses LLM to extract Chinese text and generate replacement code via prompt templates
4. **File Processing** - Writes processed files according to configuration (source or temp directory)
5. **Translation Processing** - Batch translates extracted text to target languages using LLM

### Key Components

- **Prompt Template System**: Specialized templates for different file types (React TSX/JSX, Vue, TypeScript, JavaScript, Generic)
- **Key Generation**: Converts Chinese text to pinyin-based keys with configurable options
- **LLM Integration**: Supports multiple providers (OpenAI, Anthropic, Ollama, etc.) via langchain-node
- **Auto Import**: Automatically adds i18n import statements based on file type and configuration

## Configuration System

### Core Configuration Structure

```json
{
  "locale": "zh-CN",
  "displayLanguage": "en-US", 
  "outputDir": "src/locales",
  "include": ["src/**/*.{js,jsx,ts,tsx}"],
  "exclude": ["node_modules/**", "dist/**"],
  "keyGeneration": {
    "maxChineseLength": 10,
    "hashLength": 6,
    "reuseExistingKey": true,
    "keyPrefix": "",
    "separator": "_",
    "pinyinOptions": {"toneType": "none", "type": "array"}
  },
  "replacement": {
    "functionName": "$t",
    "quoteType": "single",
    "autoImport": {"enabled": false}
  },
  "llm": {
    "provider": "openai",
    "model": "gpt-4o-mini",
    "temperature": 0.1,
    "extraction": {"temperature": 0, "promptTemplate": "default"},
    "translation": {"temperature": 0.3, "batchSize": 20}
  }
}
```

### Important Configuration Notes

- **File Processing**: `tempDir` configuration determines whether to modify source files or write to temporary directory
- **Key Generation**: Final keys are generated externally (not by LLM) using pinyin conversion with configurable options
- **Auto Import**: Supports multiple insertion strategies (top, afterImports, beforeFirstUse) with file-type specific import statements
- **LLM Configuration**: Separate settings for extraction (temperature=0) and translation (temperature=0.3) tasks

## Prompt Template System

### Template Selection Logic

Templates are selected based on file extension:
- `.tsx` → `extraction-react-tsx`
- `.jsx` → `extraction-react-jsx` 
- `.ts` → `extraction-typescript`
- `.js` → `extraction-javascript`
- `.vue` → `extraction-vue`
- Others → `extraction-generic`

### Template Variables

All templates use these variables:
- `{locale}` - Source language
- `{displayLanguage}` - Target language  
- `{functionName}` - Translation function name
- `{autoImport}` - Auto import configuration object
- `{fileContent}` - File content to process
- `{fileType}` - File type (generic template only)

### Output Format

All extraction templates return standardized JSON:
```json
{
  "extractedTexts": {
    "__I18N_1__": "原始中文文本1",
    "__I18N_2__": "原始中文文本2"
  },
  "transformedCode": "完整的转换后代码内容"
}
```

**Important**: Temporary keys use `__I18N_${序号}__` format for placeholder purposes only.

## Supported File Types and Scenarios

### JavaScript/TypeScript
- String literals, template strings, string concatenation
- Object properties, array elements, nested structures
- Function parameters, default values, return values
- Conditional expressions, switch statements, error handling
- Async operations, promises, state management

### React/JSX
- JSX text nodes, attribute values, dynamic attributes
- Conditional rendering, list rendering, fragment handling
- Hook integration (useState, useReducer, useContext)
- Event handlers, form validation, error boundaries
- Auto import of react-i18next hooks

### Vue
- Single File Components (template, script, style)
- Vue directives, interpolation expressions
- Composition API and Options API support
- Vue-i18n integration

### Special Cases
- Type definitions, enums, decorators (TypeScript)
- Constant definitions, configuration objects
- Error messages, validation rules
- HTML templates, JSON configurations

## Key Implementation Details

### Temporary Key Processing
- LLM generates temporary keys (`__I18N_1__`, `__I18N_2__`, etc.) as placeholders
- Final keys are generated externally using pinyin conversion
- Key generation supports prefix, separator, length limits, and duplicate handling

### Auto Import System
- Detects existing imports to avoid duplicates
- Supports ES6 import and CommonJS require syntax
- File-type specific import statements with glob pattern matching
- Configurable insertion positions (top, afterImports, beforeFirstUse)

### Error Handling
- Configuration validation with detailed error messages
- File processing errors with fallback strategies
- LLM API retry mechanisms with timeout control
- Syntax validation for transformed code

### Performance Optimizations
- Concurrent file processing with limits
- LLM response caching based on content hash
- Batch translation processing
- Incremental processing support

## Development Commands

Since this project is in the documentation phase, no specific build or test commands are available yet. The project structure suggests it will be a Node.js-based CLI tool.

## Important Considerations

- **Safety First**: Uses `tempDir` configuration to avoid modifying source files directly during development
- **Format Preservation**: Maintains original code formatting, indentation, and comments
- **Type Safety**: Ensures TypeScript compatibility and proper type handling
- **Framework Awareness**: Different processing strategies for React, Vue, and vanilla JS/TS
- **LLM Cost Optimization**: Uses temperature=0 for extraction (deterministic) and higher temperature for translation (creative)

## File Structure Reference

```
docs/                    # Comprehensive documentation
├── prd.md              # Product requirements document
├── config.md           # Configuration guide  
├── functions.md        # Functional design document
├── case.md             # Test case scenarios
└── templates/          # LLM prompt templates
    ├── extraction-*.md # File-type specific extraction templates
    ├── translation-batch.md # Batch translation template
    └── README.md       # Template system documentation
```

The documentation provides extremely detailed scenarios and processing rules for each supported file type and use case.
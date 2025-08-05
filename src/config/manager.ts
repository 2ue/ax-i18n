import { cosmiconfigSync } from 'cosmiconfig';
import type { I18nConfig } from './types.js';
import { DEFAULT_CONFIG, CONFIG_FILE_NAMES } from './defaults.js';
import { validateConfig } from './validation.js';
import { getFileSystem, type FileSystemService } from '../utils/file-system.js';

// 使用简单的合并函数替代 lodash
function deepMerge(target: any, source: any): any {
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  
  return result;
}

/**
 * 配置管理器
 */
export class ConfigManager {
  private config: I18nConfig | null = null;
  private configPath: string | null = null;
  private fs: FileSystemService;

  constructor(fileSystem?: FileSystemService) {
    this.fs = fileSystem || getFileSystem();
  }

  /**
   * 加载配置
   */
  async loadConfig(configPath?: string): Promise<I18nConfig> {
    try {
      if (configPath) {
        // 从指定路径加载
        this.configPath = this.fs.resolve(configPath);
        const userConfig = await this.loadConfigFromFile(this.configPath);
        this.config = this.mergeWithDefaults(userConfig);
      } else {
        // 搜索配置文件
        const explorer = cosmiconfigSync('i18n', {
          searchPlaces: CONFIG_FILE_NAMES,
        });
        
        const result = explorer.search();
        if (result) {
          this.configPath = result.filepath;
          this.config = this.mergeWithDefaults(result.config);
        } else {
          // 使用默认配置
          this.config = DEFAULT_CONFIG;
        }
      }

      // 验证配置
      this.config = validateConfig(this.config);
      
      // 处理环境变量
      this.processEnvironmentVariables();
      
      return this.config;
    } catch (error) {
      throw new Error(`加载配置失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取当前配置
   */
  getConfig(): I18nConfig {
    if (!this.config) {
      throw new Error('配置尚未加载，请先调用 loadConfig()');
    }
    return this.config;
  }

  /**
   * 获取配置文件路径
   */
  getConfigPath(): string | null {
    return this.configPath;
  }

  /**
   * 初始化配置文件
   */
  async initConfig(outputPath: string = 'i18n.config.json'): Promise<void> {
    const configPath = this.fs.resolve(outputPath);
    
    if (await this.fs.pathExists(configPath)) {
      throw new Error(`配置文件已存在: ${configPath}`);
    }

    const content = JSON.stringify(DEFAULT_CONFIG, null, 2);
    await this.fs.writeFile(configPath, content, 'utf-8');
    console.log(`配置文件已创建: ${configPath}`);
  }

  /**
   * 从文件加载配置
   */
  private async loadConfigFromFile(filePath: string): Promise<Partial<I18nConfig>> {
    if (!await this.fs.pathExists(filePath)) {
      throw new Error(`配置文件不存在: ${filePath}`);
    }

    const ext = this.fs.extname(filePath);
    
    if (ext === '.json') {
      const content = await this.fs.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } else if (ext === '.js' || ext === '.mjs') {
      const module = await import(filePath);
      return module.default || module;
    } else {
      throw new Error(`不支持的配置文件格式: ${ext}`);
    }
  }

  /**
   * 合并用户配置与默认配置
   */
  private mergeWithDefaults(userConfig: Partial<I18nConfig>): I18nConfig {
    return deepMerge(DEFAULT_CONFIG, userConfig);
  }

  /**
   * 处理环境变量
   */
  private processEnvironmentVariables(): void {
    if (!this.config) return;

    // 处理 LLM API Key
    if (!this.config.llm.apiKey && process.env.LLM_API_KEY) {
      this.config.llm.apiKey = process.env.LLM_API_KEY;
    }

    // 处理不同提供者的特定环境变量
    const provider = this.config.llm.provider;
    switch (provider) {
      case 'openai':
        if (!this.config.llm.apiKey && process.env.OPENAI_API_KEY) {
          this.config.llm.apiKey = process.env.OPENAI_API_KEY;
        }
        if (!this.config.llm.baseURL && process.env.OPENAI_BASE_URL) {
          this.config.llm.baseURL = process.env.OPENAI_BASE_URL;
        }
        break;
      case 'anthropic':
        if (!this.config.llm.apiKey && process.env.ANTHROPIC_API_KEY) {
          this.config.llm.apiKey = process.env.ANTHROPIC_API_KEY;
        }
        break;
      case 'ollama':
        if (!this.config.llm.baseURL) {
          this.config.llm.baseURL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
        }
        break;
    }
  }

  /**
   * 验证配置文件和路径
   */
  async validatePaths(): Promise<void> {
    if (!this.config) {
      throw new Error('配置尚未加载');
    }

    // 检查输出目录
    try {
      await this.fs.ensureDir(this.config.outputDir);
    } catch (error) {
      throw new Error(`无法创建输出目录 ${this.config.outputDir}: ${error}`);
    }

    // 检查临时目录
    if (this.config.tempDir) {
      try {
        await this.fs.ensureDir(this.config.tempDir);
      } catch (error) {
        throw new Error(`无法创建临时目录 ${this.config.tempDir}: ${error}`);
      }
    }
  }
}
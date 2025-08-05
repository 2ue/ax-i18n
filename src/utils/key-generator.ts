import { pinyin } from 'pinyin-pro';
import { createHash } from 'crypto';
import type { KeyGenerationConfig } from '../config/types.js';

/**
 * Key生成器
 */
export class KeyGenerator {
  private config: KeyGenerationConfig;
  private existingKeys = new Set<string>();
  private textToKeyMap = new Map<string, string>();

  constructor(config: KeyGenerationConfig) {
    this.config = config;
  }

  /**
   * 生成Key
   */
  generateKey(text: string): string {
    // 如果配置了复用已有key，且文本已存在，直接返回
    if (this.config.reuseExistingKey && this.textToKeyMap.has(text)) {
      return this.textToKeyMap.get(text)!;
    }

    // 中文转拼音
    const pinyinResult = this.convertToPinyin(text);
    
    // 处理长度限制
    let baseKey = this.limitLength(pinyinResult, text);
    
    // 添加前缀
    if (this.config.keyPrefix) {
      baseKey = `${this.config.keyPrefix}${this.config.separator}${baseKey}`;
    }

    // 处理重复key
    let finalKey = baseKey;
    if (!this.config.reuseExistingKey && this.existingKeys.has(baseKey)) {
      finalKey = this.handleDuplicateKey(baseKey, text);
    }

    // 记录key
    this.existingKeys.add(finalKey);
    this.textToKeyMap.set(text, finalKey);

    return finalKey;
  }

  /**
   * 批量生成key
   */
  generateKeys(texts: string[]): Record<string, string> {
    const result: Record<string, string> = {};
    
    for (const text of texts) {
      result[text] = this.generateKey(text);
    }
    
    return result;
  }

  /**
   * 替换临时key
   */
  replaceTempKeys(code: string, keyMapping: Record<string, string>): string {
    let result = code;
    
    for (const [tempKey, realKey] of Object.entries(keyMapping)) {
      const regex = new RegExp(`\\b${tempKey}\\b`, 'g');
      result = result.replace(regex, realKey);
    }
    
    return result;
  }

  /**
   * 中文转拼音
   */
  private convertToPinyin(text: string): string {
    try {
      let result: string | string[];
      
      if (this.config.pinyinOptions.type === 'array') {
        result = pinyin(text, {
          toneType: this.config.pinyinOptions.toneType,
          type: 'array',
          nonZh: 'consecutive',
        });
        return Array.isArray(result) ? result.join(this.config.separator) : String(result);
      } else {
        result = pinyin(text, {
          toneType: this.config.pinyinOptions.toneType,
          type: 'string',
          nonZh: 'consecutive',
        });
        return String(result);
      }
    } catch (error) {
      console.warn(`拼音转换失败: ${text}`, error);
      // 降级处理：使用简单的字符替换
      return this.fallbackKeyGeneration(text);
    }
  }

  /**
   * 处理长度限制
   */
  private limitLength(pinyin: string, originalText: string): string {
    if (pinyin.length <= this.config.maxChineseLength) {
      return pinyin;
    }

    // 截取并添加hash
    const truncated = pinyin.substring(0, this.config.maxChineseLength);
    const hash = this.generateHash(originalText, this.config.hashLength);
    
    return `${truncated}${this.config.separator}${hash}`;
  }

  /**
   * 处理重复key
   */
  private handleDuplicateKey(baseKey: string, text: string): string {
    const hash = this.generateHash(text + Date.now(), this.config.hashLength);
    return `${baseKey}${this.config.separator}${hash}`;
  }

  /**
   * 生成hash
   */
  private generateHash(text: string, length: number): string {
    const hash = createHash('md5').update(text).digest('hex');
    return hash.substring(0, length);
  }

  /**
   * 降级key生成（当拼音转换失败时）
   */
  private fallbackKeyGeneration(text: string): string {
    // 移除特殊字符，保留中英文数字
    const cleaned = text.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '');
    
    if (cleaned.length === 0) {
      return this.generateHash(text, 8);
    }

    // 简单替换：每个中文字符用其Unicode值表示
    return cleaned
      .split('')
      .map(char => {
        if (/[\u4e00-\u9fa5]/.test(char)) {
          return char.charCodeAt(0).toString(36);
        }
        return char.toLowerCase();
      })
      .join('');
  }

  /**
   * 加载已存在的key
   */
  loadExistingKeys(keys: string[]): void {
    for (const key of keys) {
      this.existingKeys.add(key);
    }
  }

  /**
   * 获取已生成的key统计
   */
  getStats(): { totalKeys: number; uniqueTexts: number } {
    return {
      totalKeys: this.existingKeys.size,
      uniqueTexts: this.textToKeyMap.size,
    };
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.existingKeys.clear();
    this.textToKeyMap.clear();
  }

  /**
   * 验证key格式
   */
  validateKey(key: string): boolean {
    // 基本格式检查
    if (!key || typeof key !== 'string') {
      return false;
    }

    // 检查前缀
    if (this.config.keyPrefix && !key.startsWith(this.config.keyPrefix)) {
      return false;
    }

    // 检查字符集（字母、数字、下划线、分隔符）
    const validChars = /^[a-zA-Z0-9_\-\.]+$/;
    return validChars.test(key);
  }

  /**
   * 获取已生成的文本到key的映射
   */
  getTextToKeyMap(): Map<string, string> {
    return new Map(this.textToKeyMap);
  }

  /**
   * 获取所有已生成的key
   */
  getAllKeys(): Set<string> {
    return new Set(this.existingKeys);
  }
}
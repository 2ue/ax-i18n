import fs from 'fs-extra';
import path from 'path';
import { createHash } from 'crypto';
import type { ExtractionResult, TranslationResult } from '../config/types.js';

/**
 * 缓存条目接口
 */
interface CacheEntry<T = any> {
  /** 缓存数据 */
  data: T;
  /** 创建时间戳 */
  timestamp: number;
  /** 过期时间戳 */
  expiresAt: number;
  /** 内容哈希 */
  hash: string;
}

/**
 * 缓存配置
 */
export interface CacheConfig {
  /** 是否启用缓存 */
  enabled: boolean;
  /** 缓存目录 */
  cacheDir: string;
  /** 默认过期时间（毫秒），默认24小时 */
  defaultTTL: number;
  /** 最大缓存条目数 */
  maxEntries: number;
  /** 是否启用持久化 */
  persistent: boolean;
}

/**
 * 缓存管理器
 */
export class CacheManager {
  private config: CacheConfig;
  private memoryCache = new Map<string, CacheEntry>();
  private cacheFilePath: string;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      enabled: true,
      cacheDir: '.ai-i18n-cache',
      defaultTTL: 24 * 60 * 60 * 1000, // 24小时
      maxEntries: 1000,
      persistent: true,
      ...config,
    };
    
    this.cacheFilePath = path.join(this.config.cacheDir, 'llm-cache.json');
    
    if (this.config.enabled && this.config.persistent) {
      this.loadFromDisk();
    }
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(content: string, type: 'extraction' | 'translation'): string {
    const hash = createHash('sha256').update(content).digest('hex');
    return `${type}:${hash}`;
  }

  /**
   * 生成内容哈希
   */
  private generateContentHash(content: string): string {
    return createHash('md5').update(content).digest('hex');
  }

  /**
   * 检查缓存条目是否过期
   */
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() > entry.expiresAt;
  }

  /**
   * 清理过期条目
   */
  private cleanExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.memoryCache.entries()) {
      if (now > entry.expiresAt) {
        this.memoryCache.delete(key);
      }
    }
  }

  /**
   * 强制执行缓存大小限制
   */
  private enforceSizeLimit(): void {
    const entries = Array.from(this.memoryCache.entries());
    if (entries.length <= this.config.maxEntries) {
      return;
    }

    // 按时间戳排序，删除最旧的条目
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    const toDelete = entries.length - this.config.maxEntries;
    for (let i = 0; i < toDelete; i++) {
      this.memoryCache.delete(entries[i][0]);
    }
  }

  /**
   * 设置缓存
   */
  set<T>(key: string, data: T, ttl?: number): void {
    if (!this.config.enabled) return;

    const now = Date.now();
    const expiresAt = now + (ttl || this.config.defaultTTL);
    const hash = this.generateContentHash(JSON.stringify(data));

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt,
      hash,
    };

    this.memoryCache.set(key, entry);
    this.enforceSizeLimit();

    if (this.config.persistent) {
      this.saveToDisk();
    }
  }

  /**
   * 获取缓存
   */
  get<T>(key: string): T | null {
    if (!this.config.enabled) return null;

    const entry = this.memoryCache.get(key);
    if (!entry) return null;

    if (this.isExpired(entry)) {
      this.memoryCache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * 删除缓存条目
   */
  delete(key: string): boolean {
    if (!this.config.enabled) return false;
    
    const deleted = this.memoryCache.delete(key);
    
    if (deleted && this.config.persistent) {
      this.saveToDisk();
    }
    
    return deleted;
  }

  /**
   * 检查缓存是否存在
   */
  has(key: string): boolean {
    if (!this.config.enabled) return false;

    const entry = this.memoryCache.get(key);
    if (!entry) return false;

    if (this.isExpired(entry)) {
      this.memoryCache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.memoryCache.clear();
    
    if (this.config.persistent) {
      this.saveToDisk();
    }
  }

  /**
   * 缓存提取结果
   */
  cacheExtractionResult(prompt: string, result: ExtractionResult, ttl?: number): void {
    const key = this.generateCacheKey(prompt, 'extraction');
    this.set(key, result, ttl);
  }

  /**
   * 获取提取结果缓存
   */
  getExtractionResult(prompt: string): ExtractionResult | null {
    const key = this.generateCacheKey(prompt, 'extraction');
    return this.get<ExtractionResult>(key);
  }

  /**
   * 缓存翻译结果
   */
  cacheTranslationResult(prompt: string, result: TranslationResult, ttl?: number): void {
    const key = this.generateCacheKey(prompt, 'translation');
    this.set(key, result, ttl);
  }

  /**
   * 获取翻译结果缓存
   */
  getTranslationResult(prompt: string): TranslationResult | null {
    const key = this.generateCacheKey(prompt, 'translation');
    return this.get<TranslationResult>(key);
  }

  /**
   * 从磁盘加载缓存
   */
  private async loadFromDisk(): Promise<void> {
    try {
      if (await fs.pathExists(this.cacheFilePath)) {
        const data = await fs.readJSON(this.cacheFilePath);
        
        // 恢复Map结构并清理过期条目
        for (const [key, entry] of Object.entries(data)) {
          if (!this.isExpired(entry as CacheEntry)) {
            this.memoryCache.set(key, entry as CacheEntry);
          }
        }
      }
    } catch (error) {
      console.warn('加载缓存失败:', error);
    }
  }

  /**
   * 保存缓存到磁盘
   */
  private async saveToDisk(): Promise<void> {
    if (!this.config.persistent) return;

    try {
      await fs.ensureDir(this.config.cacheDir);
      
      // 清理过期条目后保存
      this.cleanExpired();
      
      const data = Object.fromEntries(this.memoryCache.entries());
      await fs.writeJSON(this.cacheFilePath, data, { spaces: 2 });
    } catch (error) {
      console.warn('保存缓存失败:', error);
    }
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): {
    totalEntries: number;
    memoryUsage: number;
    hitRate: number;
    oldestEntry: number | null;
    newestEntry: number | null;
  } {
    const entries = Array.from(this.memoryCache.values());
    
    let totalSize = 0;
    let oldestTimestamp = Infinity;
    let newestTimestamp = 0;
    
    for (const entry of entries) {
      totalSize += JSON.stringify(entry.data).length;
      oldestTimestamp = Math.min(oldestTimestamp, entry.timestamp);
      newestTimestamp = Math.max(newestTimestamp, entry.timestamp);
    }

    return {
      totalEntries: entries.length,
      memoryUsage: totalSize,
      hitRate: 0, // 需要单独跟踪命中率
      oldestEntry: oldestTimestamp === Infinity ? null : oldestTimestamp,
      newestEntry: newestTimestamp === 0 ? null : newestTimestamp,
    };
  }

  /**
   * 清理过期缓存（公开方法）
   */
  cleanup(): void {
    this.cleanExpired();
    this.enforceSizeLimit();
    
    if (this.config.persistent) {
      this.saveToDisk();
    }
  }

  /**
   * 启用/禁用缓存
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    
    if (!enabled) {
      this.clear();
    }
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (newConfig.cacheDir) {
      this.cacheFilePath = path.join(this.config.cacheDir, 'llm-cache.json');
    }
  }

  /**
   * 导出缓存数据
   */
  async exportCache(filePath: string): Promise<void> {
    const data = Object.fromEntries(this.memoryCache.entries());
    await fs.writeJSON(filePath, data, { spaces: 2 });
  }

  /**
   * 导入缓存数据
   */
  async importCache(filePath: string): Promise<void> {
    if (await fs.pathExists(filePath)) {
      const data = await fs.readJSON(filePath);
      
      for (const [key, entry] of Object.entries(data)) {
        if (!this.isExpired(entry as CacheEntry)) {
          this.memoryCache.set(key, entry as CacheEntry);
        }
      }
      
      this.enforceSizeLimit();
    }
  }
}
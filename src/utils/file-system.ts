import fs from 'fs-extra';
import path from 'path';

/**
 * 文件系统操作接口
 */
export interface FileSystemService {
  // 文件读取操作
  readFile(filePath: string, encoding?: BufferEncoding): Promise<string>;
  readFileSync(filePath: string, encoding?: BufferEncoding): string;
  
  // 文件写入操作
  writeFile(filePath: string, content: string, encoding?: BufferEncoding): Promise<void>;
  writeFileSync(filePath: string, content: string, encoding?: BufferEncoding): void;
  
  // 文件/目录检查
  pathExists(filePath: string): Promise<boolean>;
  pathExistsSync(filePath: string): boolean;
  isFile(filePath: string): Promise<boolean>;
  isDirectory(filePath: string): Promise<boolean>;
  
  // 目录操作
  ensureDir(dirPath: string): Promise<void>;
  ensureDirSync(dirPath: string): void;
  readdir(dirPath: string): Promise<string[]>;
  remove(filePath: string): Promise<void>;
  removeSync(filePath: string): void;
  copy(src: string, dest: string): Promise<void>;
  
  // 文件信息
  stat(filePath: string): Promise<fs.Stats>;
  
  // 路径操作 (直接使用path模块，不需要抽象)
  join(...paths: string[]): string;
  dirname(filePath: string): string;
  basename(filePath: string, ext?: string): string;
  extname(filePath: string): string;
  resolve(...paths: string[]): string;
  relative(from: string, to: string): string;
}

/**
 * 真实文件系统实现
 */
export class RealFileSystem implements FileSystemService {
  async readFile(filePath: string, encoding: BufferEncoding = 'utf-8'): Promise<string> {
    return fs.readFile(filePath, encoding);
  }

  readFileSync(filePath: string, encoding: BufferEncoding = 'utf-8'): string {
    return fs.readFileSync(filePath, encoding);
  }

  async writeFile(filePath: string, content: string, encoding: BufferEncoding = 'utf-8'): Promise<void> {
    return fs.writeFile(filePath, content, encoding);
  }

  writeFileSync(filePath: string, content: string, encoding: BufferEncoding = 'utf-8'): void {
    fs.writeFileSync(filePath, content, encoding);
  }

  async pathExists(filePath: string): Promise<boolean> {
    return fs.pathExists(filePath);
  }

  pathExistsSync(filePath: string): boolean {
    return fs.pathExistsSync(filePath);
  }

  async isFile(filePath: string): Promise<boolean> {
    try {
      const stats = await fs.stat(filePath);
      return stats.isFile();
    } catch {
      return false;
    }
  }

  async isDirectory(filePath: string): Promise<boolean> {
    try {
      const stats = await fs.stat(filePath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  async ensureDir(dirPath: string): Promise<void> {
    return fs.ensureDir(dirPath);
  }

  ensureDirSync(dirPath: string): void {
    fs.ensureDirSync(dirPath);
  }

  async readdir(dirPath: string): Promise<string[]> {
    return fs.readdir(dirPath);
  }

  async remove(filePath: string): Promise<void> {
    return fs.remove(filePath);
  }

  removeSync(filePath: string): void {
    fs.removeSync(filePath);
  }

  async copy(src: string, dest: string): Promise<void> {
    return fs.copy(src, dest);
  }

  async stat(filePath: string): Promise<fs.Stats> {
    return fs.stat(filePath);
  }

  join(...paths: string[]): string {
    return path.join(...paths);
  }

  dirname(filePath: string): string {
    return path.dirname(filePath);
  }

  basename(filePath: string, ext?: string): string {
    return path.basename(filePath, ext);
  }

  extname(filePath: string): string {
    return path.extname(filePath);
  }

  resolve(...paths: string[]): string {
    return path.resolve(...paths);
  }

  relative(from: string, to: string): string {
    return path.relative(from, to);
  }
}

/**
 * 内存文件系统实现 (用于测试)
 */
export class MemoryFileSystem implements FileSystemService {
  private files = new Map<string, string>();
  private directories = new Set<string>();

  constructor() {
    // 默认添加根目录
    this.directories.add('/');
  }

  async readFile(filePath: string, _encoding?: BufferEncoding): Promise<string> {
    const normalizedPath = this.normalizePath(filePath);
    if (!this.files.has(normalizedPath)) {
      throw new Error(`ENOENT: no such file or directory, open '${filePath}'`);
    }
    return this.files.get(normalizedPath)!;
  }

  readFileSync(filePath: string, _encoding?: BufferEncoding): string {
    const normalizedPath = this.normalizePath(filePath);
    if (!this.files.has(normalizedPath)) {
      throw new Error(`ENOENT: no such file or directory, open '${filePath}'`);
    }
    return this.files.get(normalizedPath)!;
  }

  async writeFile(filePath: string, content: string, _encoding?: BufferEncoding): Promise<void> {
    const normalizedPath = this.normalizePath(filePath);
    const dirPath = this.dirname(normalizedPath);
    
    // 确保目录存在
    await this.ensureDir(dirPath);
    this.files.set(normalizedPath, content);
  }

  writeFileSync(filePath: string, content: string, _encoding?: BufferEncoding): void {
    const normalizedPath = this.normalizePath(filePath);
    const dirPath = this.dirname(normalizedPath);
    
    // 确保目录存在
    this.ensureDirSync(dirPath);
    this.files.set(normalizedPath, content);
  }

  async pathExists(filePath: string): Promise<boolean> {
    const normalizedPath = this.normalizePath(filePath);
    return this.files.has(normalizedPath) || this.directories.has(normalizedPath);
  }

  pathExistsSync(filePath: string): boolean {
    const normalizedPath = this.normalizePath(filePath);
    return this.files.has(normalizedPath) || this.directories.has(normalizedPath);
  }

  async isFile(filePath: string): Promise<boolean> {
    const normalizedPath = this.normalizePath(filePath);
    return this.files.has(normalizedPath);
  }

  async isDirectory(filePath: string): Promise<boolean> {
    const normalizedPath = this.normalizePath(filePath);
    return this.directories.has(normalizedPath);
  }

  async ensureDir(dirPath: string): Promise<void> {
    const normalizedPath = this.normalizePath(dirPath);
    
    // 递归创建父目录
    const parentDir = this.dirname(normalizedPath);
    if (parentDir !== normalizedPath && !this.directories.has(parentDir)) {
      await this.ensureDir(parentDir);
    }
    
    this.directories.add(normalizedPath);
  }

  ensureDirSync(dirPath: string): void {
    const normalizedPath = this.normalizePath(dirPath);
    
    // 递归创建父目录
    const parentDir = this.dirname(normalizedPath);
    if (parentDir !== normalizedPath && !this.directories.has(parentDir)) {
      this.ensureDirSync(parentDir);
    }
    
    this.directories.add(normalizedPath);
  }

  async readdir(dirPath: string): Promise<string[]> {
    const normalizedPath = this.normalizePath(dirPath);
    
    if (!this.directories.has(normalizedPath)) {
      throw new Error(`ENOENT: no such file or directory, scandir '${dirPath}'`);
    }

    const entries: string[] = [];
    
    // 查找直接子文件
    for (const filePath of this.files.keys()) {
      const fileDir = this.dirname(filePath);
      if (fileDir === normalizedPath) {
        entries.push(this.basename(filePath));
      }
    }
    
    // 查找直接子目录
    for (const dirPath of this.directories) {
      const parentDir = this.dirname(dirPath);
      if (parentDir === normalizedPath && dirPath !== normalizedPath) {
        entries.push(this.basename(dirPath));
      }
    }
    
    return entries;
  }

  async remove(filePath: string): Promise<void> {
    const normalizedPath = this.normalizePath(filePath);
    
    if (this.files.has(normalizedPath)) {
      this.files.delete(normalizedPath);
    } else if (this.directories.has(normalizedPath)) {
      // 删除目录及其所有子文件和子目录
      this.directories.delete(normalizedPath);
      
      // 删除所有子文件
      for (const filePath of Array.from(this.files.keys())) {
        if (filePath.startsWith(normalizedPath + '/')) {
          this.files.delete(filePath);
        }
      }
      
      // 删除所有子目录
      for (const dirPath of Array.from(this.directories)) {
        if (dirPath.startsWith(normalizedPath + '/')) {
          this.directories.delete(dirPath);
        }
      }
    }
  }

  removeSync(filePath: string): void {
    const normalizedPath = this.normalizePath(filePath);
    
    if (this.files.has(normalizedPath)) {
      this.files.delete(normalizedPath);
    } else if (this.directories.has(normalizedPath)) {
      // 删除目录及其所有子文件和子目录
      this.directories.delete(normalizedPath);
      
      // 删除所有子文件
      for (const filePath of Array.from(this.files.keys())) {
        if (filePath.startsWith(normalizedPath + '/')) {
          this.files.delete(filePath);
        }
      }
      
      // 删除所有子目录
      for (const dirPath of Array.from(this.directories)) {
        if (dirPath.startsWith(normalizedPath + '/')) {
          this.directories.delete(dirPath);
        }
      }
    }
  }

  async copy(src: string, dest: string): Promise<void> {
    const normalizedSrc = this.normalizePath(src);
    const normalizedDest = this.normalizePath(dest);
    
    if (this.files.has(normalizedSrc)) {
      // 复制文件
      const content = this.files.get(normalizedSrc)!;
      await this.writeFile(normalizedDest, content);
    } else if (this.directories.has(normalizedSrc)) {
      // 复制目录及其内容
      await this.ensureDir(normalizedDest);
      
      // 复制所有子文件
      for (const [filePath, content] of this.files) {
        if (filePath.startsWith(normalizedSrc + '/')) {
          const relativePath = filePath.substring(normalizedSrc.length + 1);
          const destFilePath = this.join(normalizedDest, relativePath);
          await this.writeFile(destFilePath, content);
        }
      }
      
      // 复制所有子目录
      for (const dirPath of this.directories) {
        if (dirPath.startsWith(normalizedSrc + '/')) {
          const relativePath = dirPath.substring(normalizedSrc.length + 1);
          const destDirPath = this.join(normalizedDest, relativePath);
          await this.ensureDir(destDirPath);
        }
      }
    } else {
      throw new Error(`ENOENT: no such file or directory, open '${src}'`);
    }
  }

  async stat(filePath: string): Promise<fs.Stats> {
    const normalizedPath = this.normalizePath(filePath);
    
    if (this.files.has(normalizedPath)) {
      // 创建文件stats
      return {
        isFile: () => true,
        isDirectory: () => false,
        size: this.files.get(normalizedPath)!.length,
        mtime: new Date(),
        ctime: new Date(),
        atime: new Date(),
      } as fs.Stats;
    }
    
    if (this.directories.has(normalizedPath)) {
      // 创建目录stats
      return {
        isFile: () => false,
        isDirectory: () => true,
        size: 0,
        mtime: new Date(),
        ctime: new Date(),
        atime: new Date(),
      } as fs.Stats;
    }
    
    throw new Error(`ENOENT: no such file or directory, stat '${filePath}'`);
  }

  join(...paths: string[]): string {
    return path.join(...paths);
  }

  dirname(filePath: string): string {
    return path.dirname(filePath);
  }

  basename(filePath: string, ext?: string): string {
    return path.basename(filePath, ext);
  }

  extname(filePath: string): string {
    return path.extname(filePath);
  }

  resolve(...paths: string[]): string {
    return path.resolve(...paths);
  }

  relative(from: string, to: string): string {
    return path.relative(from, to);
  }

  /**
   * 规范化路径（内存文件系统特有）
   */
  private normalizePath(filePath: string): string {
    return path.resolve(filePath).replace(/\\/g, '/');
  }

  /**
   * 清理内存文件系统（测试用）
   */
  clear(): void {
    this.files.clear();
    this.directories.clear();
    this.directories.add('/');
  }

  /**
   * 获取所有文件列表（测试用）
   */
  getAllFiles(): string[] {
    return Array.from(this.files.keys());
  }

  /**
   * 获取所有目录列表（测试用）
   */
  getAllDirectories(): string[] {
    return Array.from(this.directories);
  }
}

/**
 * 全局文件系统实例
 */
let globalFileSystem: FileSystemService = new RealFileSystem();

/**
 * 设置文件系统实现
 */
export function setFileSystem(fileSystem: FileSystemService): void {
  globalFileSystem = fileSystem;
}

/**
 * 获取当前文件系统实例
 */
export function getFileSystem(): FileSystemService {
  return globalFileSystem;
}

/**
 * 重置为真实文件系统
 */
export function resetFileSystem(): void {
  globalFileSystem = new RealFileSystem();
}
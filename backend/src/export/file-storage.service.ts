import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import * as crypto from 'crypto';

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const unlink = promisify(fs.unlink);
const mkdir = promisify(fs.mkdir);
const stat = promisify(fs.stat);
const readdir = promisify(fs.readdir);

@Injectable()
export class FileStorageService {
  private readonly logger = new Logger(FileStorageService.name);
  private readonly storagePath: string;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.storagePath =
      this.configService.get<string>('EXPORT_STORAGE_PATH') ||
      path.join(process.cwd(), 'uploads', 'exports');
    this.baseUrl =
      this.configService.get<string>('API_URL') || 'http://localhost:3001';

    // Ensure storage directory exists
    this.ensureStorageDirectory();
  }

  private async ensureStorageDirectory() {
    try {
      await mkdir(this.storagePath, { recursive: true });
      this.logger.log(`📁 Export storage directory: ${this.storagePath}`);
    } catch (error) {
      this.logger.error(
        `Failed to create storage directory: ${error.message}`,
      );
    }
  }

  /**
   * Save file to local storage
   */
  async saveFile(
    content: Buffer | string,
    entityType: string,
    format: string,
    userId: string,
  ): Promise<{
    fileUrl: string;
    fileName: string;
    fileSize: number;
    filePath: string;
  }> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const hash = crypto.randomBytes(8).toString('hex');
    const fileName = `${entityType}-${timestamp}-${hash}.${format}`;
    const filePath = path.join(this.storagePath, fileName);

    try {
      // Convert string to buffer if needed
      const buffer = Buffer.isBuffer(content)
        ? content
        : Buffer.from(content, 'utf-8');

      await writeFile(filePath, buffer);

      const stats = await stat(filePath);
      const fileSize = stats.size;

      // Generate public URL
      const fileUrl = `${this.baseUrl}/api/export/download/${fileName}`;

      this.logger.log(
        `✅ File saved: ${fileName} (${this.formatBytes(fileSize)})`,
      );

      return {
        fileUrl,
        fileName,
        fileSize,
        filePath,
      };
    } catch (error) {
      this.logger.error(`Failed to save file: ${error.message}`);
      throw error;
    }
  }

  /**
   * Read file from storage
   */
  async readFile(fileName: string): Promise<Buffer> {
    const filePath = path.join(this.storagePath, fileName);

    try {
      // Security: Prevent directory traversal
      const normalizedPath = path.normalize(filePath);
      if (!normalizedPath.startsWith(this.storagePath)) {
        throw new NotFoundException('Invalid file path');
      }

      const buffer = await readFile(filePath);
      return buffer;
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new NotFoundException('File not found');
      }
      throw error;
    }
  }

  /**
   * Delete file from storage
   */
  async deleteFile(fileName: string): Promise<void> {
    const filePath = path.join(this.storagePath, fileName);

    try {
      // Security: Prevent directory traversal
      const normalizedPath = path.normalize(filePath);
      if (!normalizedPath.startsWith(this.storagePath)) {
        throw new NotFoundException('Invalid file path');
      }

      await unlink(filePath);
      this.logger.log(`🗑️  File deleted: ${fileName}`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        this.logger.warn(`File not found (already deleted?): ${fileName}`);
        return;
      }
      this.logger.error(`Failed to delete file: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete expired files (older than specified hours)
   */
  async deleteExpiredFiles(expirationHours: number = 24): Promise<number> {
    try {
      const files = await readdir(this.storagePath);
      const now = Date.now();
      const expirationMs = expirationHours * 60 * 60 * 1000;
      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(this.storagePath, file);
        try {
          const stats = await stat(filePath);
          const age = now - stats.mtimeMs;

          if (age > expirationMs) {
            await unlink(filePath);
            deletedCount++;
            this.logger.log(`🗑️  Expired file deleted: ${file}`);
          }
        } catch (error) {
          this.logger.error(
            `Error processing file ${file}: ${error.message}`,
          );
        }
      }

      if (deletedCount > 0) {
        this.logger.log(
          `✅ Cleanup completed: ${deletedCount} expired file(s) deleted`,
        );
      }

      return deletedCount;
    } catch (error) {
      this.logger.error(`Failed to cleanup expired files: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get file info
   */
  async getFileInfo(
    fileName: string,
  ): Promise<{ size: number; created: Date; exists: boolean }> {
    const filePath = path.join(this.storagePath, fileName);

    try {
      const stats = await stat(filePath);
      return {
        size: stats.size,
        created: stats.birthtime,
        exists: true,
      };
    } catch (error) {
      if (error.code === 'ENOENT') {
        return {
          size: 0,
          created: new Date(),
          exists: false,
        };
      }
      throw error;
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    oldestFile: Date | null;
    newestFile: Date | null;
  }> {
    try {
      const files = await readdir(this.storagePath);
      let totalSize = 0;
      let oldestFile: Date | null = null;
      let newestFile: Date | null = null;

      for (const file of files) {
        const filePath = path.join(this.storagePath, file);
        try {
          const stats = await stat(filePath);
          totalSize += stats.size;

          if (!oldestFile || stats.birthtime < oldestFile) {
            oldestFile = stats.birthtime;
          }
          if (!newestFile || stats.birthtime > newestFile) {
            newestFile = stats.birthtime;
          }
        } catch (error) {
          // Skip files that can't be accessed
        }
      }

      return {
        totalFiles: files.length,
        totalSize,
        oldestFile,
        newestFile,
      };
    } catch (error) {
      this.logger.error(`Failed to get storage stats: ${error.message}`);
      throw error;
    }
  }

  /**
   * Format bytes to human-readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}

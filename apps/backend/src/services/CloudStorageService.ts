import { Storage, UploadOptions } from '@google-cloud/storage';
import { logger } from '../utils/logger';

export interface CloudUploadParams {
  buffer: Buffer;
  destination: string;
  contentType: string;
  metadata?: Record<string, string>;
  makePublic?: boolean;
}

export interface CloudUploadResult {
  bucket: string;
  objectName: string;
  publicUrl?: string;
}

/**
 * Google Cloud Storage 上传服务
 */
export class CloudStorageService {
  private storage: Storage | null = null;
  private bucketName: string | null = null;

  constructor() {
    this.bucketName = process.env.GCS_BUCKET_NAME || null; // 2025-11-11T16:18:55Z Added by Assistant: 读取存储桶名称

    if (!this.bucketName) {
      logger.warn('CloudStorageService disabled: GCS_BUCKET_NAME not configured'); // 2025-11-11T16:18:55Z Added by Assistant: 配置缺失警告
      return;
    }

    try {
      const options: { projectId?: string } = {};
      if (process.env.GCS_PROJECT_ID) {
        options.projectId = process.env.GCS_PROJECT_ID;
      }
      this.storage = new Storage(options); // 2025-11-11T16:18:55Z Added by Assistant: 初始化 Storage 客户端
    } catch (error) {
      logger.error('Failed to initialize Google Cloud Storage client', error); // 2025-11-11T16:18:55Z Added by Assistant: 初始化失败日志
      this.storage = null;
      this.bucketName = null;
    }
  }

  /**
   * 判断 GCS 是否可用
   */
  isEnabled(): boolean {
    return Boolean(this.storage && this.bucketName); // 2025-11-11T16:18:55Z Added by Assistant: GCS 可用性检查
  }

  /**
   * 上传 Buffer 到云存储
   */
  async upload(params: CloudUploadParams): Promise<CloudUploadResult> {
    if (!this.storage || !this.bucketName) {
      throw new Error('Cloud storage is not configured'); // 2025-11-11T16:18:55Z Added by Assistant: 未配置异常
    }

    const bucket = this.storage.bucket(this.bucketName);
    const file = bucket.file(params.destination);

    const uploadOptions: UploadOptions = {
      resumable: false,
      metadata: {
        contentType: params.contentType,
        ...params.metadata
      }
    };

    await file.save(params.buffer, uploadOptions); // 2025-11-11T16:18:55Z Added by Assistant: 执行上传

    if (params.makePublic) {
      await file.makePublic().catch(error => {
        logger.warn('Failed to make POD object public', error); // 2025-11-11T16:18:55Z Added by Assistant: 公有化失败日志
      });
    }

    const publicUrl = params.makePublic
      ? `https://storage.googleapis.com/${this.bucketName}/${params.destination}`
      : undefined;

    return {
      bucket: this.bucketName,
      objectName: params.destination,
      publicUrl
    };
  }
}


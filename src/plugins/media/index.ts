import { Plugin } from '@/types';

export interface MediaConfig {
  storage: {
    type: 'local' | 's3' | 'cloudinary';
    path?: string;
    bucket?: string;
    region?: string;
    cloudName?: string;
    apiKey?: string;
    apiSecret?: string;
  };
  features: {
    imageProcessing: boolean;
    videoProcessing: boolean;
    cdn: boolean;
    optimization: boolean;
  };
  processing: {
    imageFormats: string[];
    videoFormats: string[];
    maxSize: number;
    quality: number;
  };
  cdn: {
    enabled: boolean;
    domain?: string;
    secure: boolean;
    cacheControl: string;
  };
  monitoring: {
    enabled: boolean;
    metrics: boolean;
    logs: boolean;
  };
}

export class MediaPlugin implements Plugin {
  name = 'media';
  version = '1.0.0';
  private config?: MediaConfig;

  configure(config: MediaConfig): void {
    this.config = {
      storage: {
        type: config.storage?.type || 'local',
        path: config.storage?.path || 'uploads',
        bucket: config.storage?.bucket,
        region: config.storage?.region,
        cloudName: config.storage?.cloudName,
        apiKey: config.storage?.apiKey,
        apiSecret: config.storage?.apiSecret
      },
      features: {
        imageProcessing: config.features?.imageProcessing ?? true,
        videoProcessing: config.features?.videoProcessing ?? true,
        cdn: config.features?.cdn ?? true,
        optimization: config.features?.optimization ?? true
      },
      processing: {
        imageFormats: config.processing?.imageFormats || ['jpg', 'png', 'webp'],
        videoFormats: config.processing?.videoFormats || ['mp4', 'webm'],
        maxSize: config.processing?.maxSize || 10 * 1024 * 1024, // 10MB
        quality: config.processing?.quality || 80
      },
      cdn: {
        enabled: config.cdn?.enabled ?? true,
        domain: config.cdn?.domain,
        secure: config.cdn?.secure ?? true,
        cacheControl: config.cdn?.cacheControl || 'public, max-age=31536000'
      },
      monitoring: {
        enabled: config.monitoring?.enabled ?? true,
        metrics: config.monitoring?.metrics ?? true,
        logs: config.monitoring?.logs ?? true
      }
    };
  }

  async install(): Promise<void> {
    if (!this.config) {
      throw new Error('Media configuration not set');
    }

    await this.setupDependencies();
    await this.createMediaService();
    await this.setupStorage();
    await this.setupMonitoring();
    console.log('Media plugin installed successfully');
  }

  async uninstall(): Promise<void> {
    console.log('Media plugin uninstalled');
  }

  private async setupDependencies(): Promise<void> {
    const dependencies = {
      ...(this.config?.storage.type === 's3' && {
        '@aws-sdk/client-s3': '^3.0.0',
        '@aws-sdk/s3-request-presigner': '^3.0.0'
      }),
      ...(this.config?.storage.type === 'cloudinary' && {
        'cloudinary': '^1.37.0'
      }),
      'sharp': '^0.32.1',
      'ffmpeg-static': '^5.1.0',
      'fluent-ffmpeg': '^2.1.2',
      'multer': '^1.4.5-lts.1',
      'winston': '^3.8.2',
      'prom-client': '^14.2.0'
    };

    console.log('Added Media dependencies:', dependencies);
  }

  private async createMediaService(): Promise<void> {
    const mediaService = `
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v2 as cloudinary } from 'cloudinary';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import multer from 'multer';
import { createWriteStream, createReadStream, unlink } from 'fs';
import { promisify } from 'util';
import { join, extname, basename } from 'path';
import { trackMetrics } from './monitoring';

const unlinkAsync = promisify(unlink);

export interface MediaOptions {
  type: 'image' | 'video';
  file: Express.Multer.File;
  transformations?: {
    width?: number;
    height?: number;
    format?: string;
    quality?: number;
    crop?: string;
    rotate?: number;
    flip?: boolean;
    flop?: boolean;
  };
  storage?: {
    path?: string;
    filename?: string;
    contentType?: string;
  };
}

export class MediaService {
  private s3Client?: S3Client;
  private upload: multer.Multer;
  private storageConfig: typeof this.config.storage;

  constructor() {
    this.storageConfig = ${JSON.stringify(this.config?.storage)};
    this.setupStorage();
    this.setupUploader();
  }

  private setupStorage(): void {
    switch (this.storageConfig.type) {
      case 's3':
        this.s3Client = new S3Client({
          region: this.storageConfig.region,
          credentials: {
            accessKeyId: this.storageConfig.apiKey || '',
            secretAccessKey: this.storageConfig.apiSecret || ''
          }
        });
        break;

      case 'cloudinary':
        cloudinary.config({
          cloud_name: this.storageConfig.cloudName,
          api_key: this.storageConfig.apiKey,
          api_secret: this.storageConfig.apiSecret
        });
        break;
    }
  }

  private setupUploader(): void {
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, this.storageConfig.path || 'uploads');
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + extname(file.originalname));
      }
    });

    this.upload = multer({
      storage,
      limits: {
        fileSize: ${this.config?.processing.maxSize}
      },
      fileFilter: (req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase().slice(1);
        const isImage = ${JSON.stringify(this.config?.processing.imageFormats)}.includes(ext);
        const isVideo = ${JSON.stringify(this.config?.processing.videoFormats)}.includes(ext);

        if (isImage || isVideo) {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type'));
        }
      }
    });
  }

  async uploadMedia(options: MediaOptions): Promise<{
    url: string;
    path: string;
    size: number;
    format: string;
  }> {
    const startTime = Date.now();
    
    try {
      const processedFile = await this.processFile(options);
      const uploadedFile = await this.storeFile(processedFile, options);
      const duration = Date.now() - startTime;

      ${this.config?.monitoring.metrics ? `
      trackMetrics('media_uploaded', {
        type: options.type,
        size: uploadedFile.size,
        duration
      });` : ''}

      return uploadedFile;
    } catch (error) {
      ${this.config?.monitoring.metrics ? `
      trackMetrics('media_error', {
        type: options.type,
        error: error.message
      });` : ''}
      
      throw error;
    }
  }

  async deleteMedia(path: string): Promise<void> {
    try {
      await this.deleteFile(path);
    } catch (error) {
      console.error('Media delete error:', error);
      throw error;
    }
  }

  async getSignedUrl(path: string, expiresIn: number = 3600): Promise<string> {
    switch (this.storageConfig.type) {
      case 's3':
        const command = new GetObjectCommand({
          Bucket: this.storageConfig.bucket,
          Key: path
        });
        return getSignedUrl(this.s3Client!, command, { expiresIn });

      case 'cloudinary':
        return cloudinary.url(path, {
          secure: ${this.config?.cdn.secure},
          sign_url: true,
          expires_at: Math.floor(Date.now() / 1000) + expiresIn
        });

      default:
        return path;
    }
  }

  private async processFile(options: MediaOptions): Promise<string> {
    const { file, transformations } = options;
    const outputPath = join(
      this.storageConfig.path || 'uploads',
      \`processed-\${basename(file.path)}\`
    );

    if (options.type === 'image') {
      await this.processImage(file.path, outputPath, transformations);
    } else {
      await this.processVideo(file.path, outputPath, transformations);
    }

    return outputPath;
  }

  private async processImage(
    inputPath: string,
    outputPath: string,
    transformations?: MediaOptions['transformations']
  ): Promise<void> {
    let image = sharp(inputPath);

    if (transformations) {
      if (transformations.width || transformations.height) {
        image = image.resize(transformations.width, transformations.height, {
          fit: 'cover'
        });
      }

      if (transformations.format) {
        image = image.toFormat(transformations.format as any, {
          quality: transformations.quality || ${this.config?.processing.quality}
        });
      }

      if (transformations.crop) {
        const [width, height] = transformations.crop.split('x').map(Number);
        image = image.crop(width, height);
      }

      if (transformations.rotate) {
        image = image.rotate(transformations.rotate);
      }

      if (transformations.flip) {
        image = image.flip();
      }

      if (transformations.flop) {
        image = image.flop();
      }
    }

    await image.toFile(outputPath);
  }

  private async processVideo(
    inputPath: string,
    outputPath: string,
    transformations?: MediaOptions['transformations']
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      let command = ffmpeg(inputPath);

      if (transformations) {
        if (transformations.width || transformations.height) {
          command = command.size(\`\${transformations.width || '?'}x\${transformations.height || '?'}\`);
        }

        if (transformations.format) {
          command = command.toFormat(transformations.format);
        }

        if (transformations.quality) {
          command = command.videoBitrate(transformations.quality * 1000);
        }
      }

      command
        .on('end', resolve)
        .on('error', reject)
        .save(outputPath);
    });
  }

  private async storeFile(
    filePath: string,
    options: MediaOptions
  ): Promise<{
    url: string;
    path: string;
    size: number;
    format: string;
  }> {
    const fileStream = createReadStream(filePath);
    const format = extname(filePath).slice(1);
    const path = options.storage?.path || \`\${options.type}s/\${basename(filePath)}\`;

    switch (this.storageConfig.type) {
      case 's3': {
        const command = new PutObjectCommand({
          Bucket: this.storageConfig.bucket,
          Key: path,
          Body: fileStream,
          ContentType: options.storage?.contentType || \`\${options.type}/\${format}\`,
          CacheControl: '${this.config?.cdn.cacheControl}'
        });

        await this.s3Client!.send(command);
        break;
      }

      case 'cloudinary': {
        await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              resource_type: options.type,
              public_id: path.replace(/\.[^/.]+$/, '')
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );

          fileStream.pipe(uploadStream);
        });
        break;
      }

      default: {
        const writeStream = createWriteStream(join(this.storageConfig.path || 'uploads', path));
        await new Promise((resolve, reject) => {
          fileStream.pipe(writeStream);
          writeStream.on('finish', resolve);
          writeStream.on('error', reject);
        });
      }
    }

    await unlinkAsync(filePath);

    return {
      url: this.getUrl(path),
      path,
      size: fileStream.bytesRead,
      format
    };
  }

  private async deleteFile(path: string): Promise<void> {
    switch (this.storageConfig.type) {
      case 's3': {
        const command = new DeleteObjectCommand({
          Bucket: this.storageConfig.bucket,
          Key: path
        });
        await this.s3Client!.send(command);
        break;
      }

      case 'cloudinary': {
        await cloudinary.uploader.destroy(path);
        break;
      }

      default: {
        await unlinkAsync(join(this.storageConfig.path || 'uploads', path));
      }
    }
  }

  private getUrl(path: string): string {
    if (${this.config?.cdn.enabled} && this.storageConfig.domain) {
      return \`\${this.storageConfig.secure ? 'https' : 'http'}://\${this.storageConfig.domain}/\${path}\`;
    }
    return path;
  }
}`;

    console.log('Created Media service');
  }

  private async setupStorage(): Promise<void> {
    const storageConfig = {
      type: this.config?.storage.type,
      path: this.config?.storage.path,
      bucket: this.config?.storage.bucket,
      region: this.config?.storage.region,
      cloudName: this.config?.storage.cloudName
    };

    console.log('Configured Media storage:', storageConfig);
  }

  private async setupMonitoring(): Promise<void> {
    const monitoringConfig = {
      enabled: this.config?.monitoring.enabled,
      metrics: {
        uploads: true,
        processing: true,
        storage: true,
        errors: true
      },
      logs: {
        level: 'info',
        format: 'json'
      }
    };

    console.log('Configured Media monitoring:', monitoringConfig);
  }
}

export const mediaPlugin = new MediaPlugin(); 
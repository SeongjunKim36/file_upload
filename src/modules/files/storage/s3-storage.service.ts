import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { IFileStorage } from '../interfaces/file-storage.interface';
import { Readable } from 'stream';

@Injectable()
export class S3StorageService implements IFileStorage {
    private s3Client: S3Client | null = null;
    private bucket: string = '';

    constructor(private configService: ConfigService) {
        try {
            this.s3Client = new S3Client({
                region: this.configService.get('AWS_REGION') || 'ap-northeast-2',
                credentials: {
                    accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID') || '',
                    secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY') || '',
                },
            });
            this.bucket = this.configService.get('AWS_S3_BUCKET') || 'default-bucket';
        } catch (error) {
            console.warn('S3 configuration not found, S3 storage will not be available');
        }
    }

    private checkS3Client() {
        if (!this.s3Client) {
            throw new Error('S3 client is not initialized');
        }
    }

    async upload(file: Express.Multer.File): Promise<string> {
        this.checkS3Client();
        const key = `${Date.now()}-${file.originalname}`;
        
        await (this.s3Client as S3Client).send(
            new PutObjectCommand({
                Bucket: this.bucket,
                Key: key,
                Body: file.buffer,
                ContentType: file.mimetype,
            })
        );

        return key;
    }

    async getFile(key: string): Promise<Buffer> {
        this.checkS3Client();
        const response = await (this.s3Client as S3Client).send(
            new GetObjectCommand({
                Bucket: this.bucket,
                Key: key,
            })
        );

        const stream = response.Body as Readable;
        return new Promise((resolve, reject) => {
            const chunks: Buffer[] = [];
            stream.on('data', (chunk) => chunks.push(chunk));
            stream.on('end', () => resolve(Buffer.concat(chunks)));
            stream.on('error', reject);
        });
    }

    async deleteFile(key: string): Promise<void> {
        this.checkS3Client();
        await (this.s3Client as S3Client).send(
            new DeleteObjectCommand({
                Bucket: this.bucket,
                Key: key,
            })
        );
    }
} 
import { Injectable } from '@nestjs/common';
import { IFileStorage } from '../interfaces/file-storage.interface';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import { Readable } from 'stream';

@Injectable()
export class S3StorageService implements IFileStorage {
    private readonly s3Client: S3Client;
    private readonly bucket: string;

    constructor(private configService: ConfigService) {
        this.s3Client = new S3Client({
            region: this.configService.get('AWS_REGION'),
            credentials: {
                accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID') || '',
                secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY') || '',
            },
        });
        this.bucket = this.configService.get('AWS_S3_BUCKET') || '';
    }

    async upload(file: File): Promise<string> {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        const key = `${uniqueSuffix}${path.extname(file.name)}`;
        
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        await this.s3Client.send(new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: buffer,
            ContentType: file.type,
        }));

        return key;
    }

    async getFile(key: string): Promise<Buffer> {
        const response = await this.s3Client.send(
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
        await this.s3Client.send(
            new DeleteObjectCommand({
                Bucket: this.bucket,
                Key: key,
            })
        );
    }
} 
import { Injectable } from '@nestjs/common';
import { IFileStorage } from '../interfaces/file-storage.interface';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Readable } from 'stream';

@Injectable()
export class LocalStorageService implements IFileStorage {
    private readonly uploadPath = 'uploads';

    constructor() {
        // uploads 디렉토리 생성
        fs.mkdir(this.uploadPath, { recursive: true });
    }

    async upload(file: Express.Multer.File): Promise<string> {
        const fileName = `${Date.now()}-${file.originalname}`;
        const filePath = path.join(this.uploadPath, fileName);
        const stream = Readable.from(file.buffer);
        await fs.writeFile(filePath, stream);
        return filePath;
    }

    async getFile(path: string): Promise<Buffer> {
        return fs.readFile(path);
    }

    async deleteFile(path: string): Promise<void> {
        await fs.unlink(path);
    }
} 
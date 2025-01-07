import { Injectable } from '@nestjs/common';
import { IFileStorage } from '../interfaces/file-storage.interface';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class LocalStorageService implements IFileStorage {
    private readonly uploadPath = 'uploads';

    constructor() {
        // uploads 디렉토리 생성
        fs.mkdir(this.uploadPath, { recursive: true });
    }

    async upload(file: Express.Multer.File): Promise<string> {
        // multer의 diskStorage를 사용하는 경우 이미 파일이 저장되어 있음
        if (file.path) {
            return file.path;
        }

        // buffer를 사용하는 경우 (메모리 스토리지)
        const fileName = `${Date.now()}-${file.originalname}`;
        const filePath = path.join(this.uploadPath, fileName);
        await fs.writeFile(filePath, file.buffer);
        return filePath;
    }

    async getFile(path: string): Promise<Buffer> {
        return fs.readFile(path);
    }

    async deleteFile(path: string): Promise<void> {
        await fs.unlink(path);
    }
} 
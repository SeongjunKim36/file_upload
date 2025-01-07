import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FileEntity } from '../entities/file.entity';
import { LocalStorageService } from '../storage/local-storage.service';
import { S3StorageService } from '../storage/s3-storage.service';
import { StorageType } from '../enums/storage-type.enum';
import { IFileStorage } from '../interfaces/file-storage.interface';

@Injectable()
export class FilesService {
    constructor(
        @InjectRepository(FileEntity)
        private fileRepository: Repository<FileEntity>,
        private localStorageService: LocalStorageService,
        private s3StorageService: S3StorageService,
    ) {}

    private getStorageService(storageType: StorageType): IFileStorage {
        switch (storageType) {
            case StorageType.LOCAL:
                return this.localStorageService;
            case StorageType.S3:
                return this.s3StorageService;
            default:
                throw new BadRequestException(`Unsupported storage type: ${storageType}`);
        }
    }

    async uploadFile(file: Express.Multer.File, storageType: StorageType = StorageType.S3) {
        const storageService = this.getStorageService(storageType);
        const path = await storageService.upload(file);
        
        const fileEntity = this.fileRepository.create({
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            path: path,
            storageType: storageType,
            metadata: JSON.stringify({
                encoding: file.encoding,
            })
        });

        const savedFile = await this.fileRepository.save(fileEntity);
        return savedFile.toDto();
    }

    async getFileInfo(id: string) {
        const file = await this.fileRepository.findOneOrFail({ where: { id } });
        return file.toDto();
    }

    async getFileContent(id: string): Promise<Buffer> {
        const file = await this.fileRepository.findOneOrFail({ where: { id } });
        return this.localStorageService.getFile(file.path);
    }
} 
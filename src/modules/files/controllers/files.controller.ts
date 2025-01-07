import { Controller, UseInterceptors, Response, UploadedFile, Body, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesService } from '../services/files.service';
import { Response as ExpressResponse } from 'express';
import { FileDto } from '../dtos/file.dto';
import { StorageType } from '../enums/storage-type.enum';
import { TypedRoute, TypedParam } from '@nestia/core';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody, ApiParam } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('files')
@ApiTags('Files')
export class FilesController {
    constructor(private readonly filesService: FilesService) {}

    @TypedRoute.Post('upload')
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: './uploads',
            filename: (req, file, callback) => {
                console.log('Multer filename callback:', file);
                const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
                callback(null, `${uniqueSuffix}${extname(file.originalname)}`);
            },
        }),
        fileFilter: (req, file, callback) => {
            console.log('Multer fileFilter:', file);
            callback(null, true);
        },
    }))
    @ApiOperation({ summary: 'Upload File' })
    @ApiResponse({ status: 201, description: 'File uploaded successfully' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            required: ['file'],
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
                storageType: {
                    type: 'string',
                    enum: Object.values(StorageType),
                    default: StorageType.LOCAL
                }
            }
        }
    })
    async uploadFile(
        @UploadedFile() file: Express.Multer.File,
        @Body() body: { storageType?: StorageType },
    ): Promise<{ id: string }> {
        if (!file) {
            throw new BadRequestException('File is required');
        }

        try {
            const uploadResult = await this.filesService.uploadFile(file, body.storageType);
            console.log('Upload result:', uploadResult);
            
            if (!uploadResult || !uploadResult.id) {
                throw new Error('Upload failed: Invalid response from service');
            }
            
            return { id: uploadResult.id.toString() };
        } catch (error) {
            console.error('Upload failed:', error);
            throw error;
        }
    }

    @TypedRoute.Get(':id/info')
    @ApiOperation({ summary: 'Get File Info' })
    @ApiResponse({ status: 200, description: 'File info retrieved successfully' })
    @ApiParam({
        name: 'id',
        required: true,
        description: 'File ID',
        type: String
    })
    async getFileInfo(
        @TypedParam('id') id: string,
    ): Promise<FileDto> {
        return this.filesService.getFileInfo(id);
    }

    @TypedRoute.Get(':id/download')
    @ApiOperation({ summary: 'Download File' })
    @ApiResponse({ status: 200, description: 'File downloaded successfully' })
    @ApiParam({
        name: 'id',
        required: true,
        description: 'File ID',
        type: String
    })
    async downloadFile(
        @TypedParam('id') id: string,
        @Response() res: ExpressResponse,
    ): Promise<void> {
        const file = await this.filesService.getFileInfo(id);
        const fileStream = await this.filesService.getFileContent(id);
        
        const encodedFilename = encodeURIComponent(file.originalName);
        
        res.set({
            'Content-Type': file.mimeType,
            'Content-Disposition': `attachment; filename*=UTF-8''${encodedFilename}`,
            'Content-Length': file.size,
        });
        
        res.send(fileStream);
    }
} 
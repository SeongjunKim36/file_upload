import { AbstractDto } from '../../../common/dto/abstract.dto';
import { FileEntity } from '../entities/file.entity';
import { StorageType } from '../enums/storage-type.enum';

export class FileDto extends AbstractDto {
    /**
     * 원본 파일명
     * @type {string}
     */
    originalName: string;

    /**
     * 파일 MIME 타입
     * @type {string}
     */
    mimeType: string;

    /**
     * 파일 크기 (bytes)
     * @type {number}
     */
    size: number;

    /**
     * 저장소 타입
     * @type {StorageType}
     */
    storageType: StorageType;

    /**
     * 파일 메타데이터
     * @type {string}
     */
    metadata: string;

    constructor(file: FileEntity) {
        super();
        this.originalName = file.originalName;
        this.mimeType = file.mimeType;
        this.size = file.size;
        this.storageType = file.storageType as StorageType;
        this.metadata = file.metadata;
    }
} 
import { AbstractEntity } from '../../../common/abstract.entity';
import { Column, Entity } from 'typeorm';
import { FileDto } from '../dtos/file.dto';

@Entity({ name: 'files' })
export class FileEntity extends AbstractEntity {
    @Column()
    originalName!: string;

    @Column()
    mimeType!: string;

    @Column()
    size!: number;

    @Column()
    path!: string;

    @Column()
    storageType!: string;

    @Column({ nullable: true })
    metadata!: string;

    toDto(): FileDto {
        return new FileDto(this);
    }
} 
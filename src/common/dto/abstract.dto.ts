'use strict';

import { Exclude, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

@Exclude()
export abstract class AbstractDto {
    @Expose()
    id!: string;

    @ApiProperty()
    createdAt!: Date;

    @ApiProperty()
    updatedAt!: Date;

    constructor() {
        // 빈 생성자
    }
}

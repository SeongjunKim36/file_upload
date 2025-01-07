
export interface IFileStorage {
    upload(file: Express.Multer.File): Promise<string>;
    getFile(path: string): Promise<Buffer>;
    deleteFile(path: string): Promise<void>;
} 
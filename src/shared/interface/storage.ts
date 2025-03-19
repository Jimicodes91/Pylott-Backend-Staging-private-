import { DocumentsDirectory } from '../enums';

export interface IStorage {
  upload(mediaDirectory?: DocumentsDirectory, media?: string, fileName?: string): Promise<{ status: boolean; data: string | null }>;
}

// @todo
// repositories - Done
// Migrations;
// Concrete implementation;

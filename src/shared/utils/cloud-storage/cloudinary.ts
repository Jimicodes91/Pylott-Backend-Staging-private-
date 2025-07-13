import { v2 as cloudinary, UploadApiOptions, UploadApiResponse } from 'cloudinary';
import { singleton } from 'tsyringe';
import { Readable } from 'stream';
import slugify from 'slugify';

import { IStorage } from '@/shared/interface/storage';
import { app, storage } from '@config/env';
import { DocumentsDirectory } from '@/shared/enums';

const { env } = app;
const { cloudinary: cfg } = storage;

@singleton()
export class Cloudinary implements IStorage {
  private readonly traceId = '[Cloudinary]';

  constructor() {
    cloudinary.config(cfg);
  }

  public async upload(mediaDirectory: DocumentsDirectory, media: string, fileName: string): Promise<{ status: boolean; data: string | null }> {
    try {
      const base64 = media.includes(',') ? media.split(',')[1] : media;
      const buffer = Buffer.from(base64, 'base64');
      const stream = Readable.from(buffer);

      const slug = this.slugifyFileName(fileName);
      const publicId = `${env}/${mediaDirectory}/${slug}`;

      const options: UploadApiOptions = {
        public_id: publicId,
        resource_type: 'auto',
        use_filename: true,
        unique_filename: false,
      };

      const result: UploadApiResponse = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
          if (error) reject(error);
          else resolve(result!);
        });
        stream.pipe(uploadStream);
      });

      return { status: true, data: result.secure_url };
    } catch (error) {
      console.error(`${this.traceId} upload failed: ${error.message}`, error.stack);
      return { status: false, data: null };
    }
  }

  private slugifyFileName(name: string): string {
    return slugify(name, {
      replacement: '-',
      remove: /[^a-zA-Z0-9 -]/g,
      lower: true,
      trim: true,
    });
  }
}

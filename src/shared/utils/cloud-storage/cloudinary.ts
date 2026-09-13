import { v2 as cloudinary, UploadApiOptions, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';
import { singleton } from 'tsyringe';
import { v4 as uuidv4 } from 'uuid';

import { DocumentsDirectory } from '@/shared/enums';
import { IStorage } from '@/shared/interface/storage';
import { app, CLOUDINARY_CONFIG } from '@config/env';

const { env } = app;

@singleton()
export class Cloudinary implements IStorage {
  private readonly traceId = '[Cloudinary]';

  constructor() {
    cloudinary.config({
      cloud_name: CLOUDINARY_CONFIG.CLOUD_NAME,
      api_key: CLOUDINARY_CONFIG.API_KEY,
      api_secret: CLOUDINARY_CONFIG.API_SECRET,
    });
  }

  // `fileName` is retained for interface compatibility but no longer used to
  // build the storage key (Req 3 — keys are randomized).
  public async upload(mediaDirectory: DocumentsDirectory, media: string, _fileName?: string): Promise<{ status: boolean; data: string | null }> {
    try {
      const base64 = media.includes(',') ? media.split(',')[1] : media;
      const buffer = Buffer.from(base64, 'base64');
      const stream = Readable.from(buffer);

      // Hardening (Req 3): storage key is a server-generated random id, not
      // derived from the client-supplied file name, so files cannot be
      // overwritten or enumerated by guessing names. The human-readable name
      // is kept on the document record separately.
      const publicId = `${env}/${mediaDirectory}/${uuidv4()}`;

      const options: UploadApiOptions = {
        public_id: publicId,
        resource_type: 'auto',
        use_filename: false,
        unique_filename: true,
        // Hardening (Req 4): force download disposition so a file is not
        // rendered inline (mitigates inline-execution / stored-XSS via uploads).
        flags: 'attachment',
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
}

import { singleton } from 'tsyringe';
import { v2 as cloudinary } from 'cloudinary';
import slugify from 'slugify';

import { IStorage } from '@/shared/interface/storage';
import { app, storage } from '@config/env';
import { DocumentsDirectory } from '@/shared/enums';

const { env } = app;
const { cloudinary: cfg } = storage;

@singleton()
export class Cloudinary implements IStorage {
  private readonly traceId = '[Cloudinary]:';

  constructor() {
    cloudinary.config(cfg);
  }

  public async upload(mediaDirectory: DocumentsDirectory, media: string, fileName: string) {
    const cleanedMedia = this.ensureDataUrl(media);
    return this.save(mediaDirectory, fileName, cleanedMedia);
  }

  private slugifyFileName(name: string): string {
    return slugify(name, {
      replacement: '-',
      remove: /[^a-zA-Z0-9 -]/g,
      lower: true,
      trim: true,
    });
  }

  private async save(
    folder_name: string,
    file_name: string,
    file_data: string,
    config?: {
      format?: 'jpg' | 'png';
      overwrite?: boolean;
      transformation?: object[];
    },
  ) {
    const publicId = `${env}/${folder_name}/` + this.slugifyFileName(file_name);

    try {
      const res = await cloudinary.uploader.upload(file_data, {
        ...config,
        public_id: publicId,
        overwrite: config?.overwrite ?? false,
        unique_filename: false,
      });
      return { status: true, data: res.secure_url };
    } catch (err) {
      console.error(err, `${this.traceId} Could not upload media to Cloudinary`, { folder_name, file_name, config });
      return { status: false, data: null };
    }
  }

  private ensureDataUrl(media: string) {
    return media.includes(',') ? media : `data:image/png;base64,${media}`;
  }
}

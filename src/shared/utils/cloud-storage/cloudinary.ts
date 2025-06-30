import { singleton } from 'tsyringe';
import { v2 as cloudinary } from 'cloudinary';

import { IStorage } from '@/shared/interface/storage';
import { app, storage } from '@config/env';
import { DocumentsDirectory } from '@/shared/enums';

const { env } = app;
const { cloudinary: cloudConfig } = storage;

@singleton()
export class Cloudinary implements IStorage {
  private readonly traceId = '[Cloudinary]:';

  constructor() {
    cloudinary.config(cloudinary.config(cloudConfig));
  }

  public async upload(mediaDirectory: DocumentsDirectory, media: string, fileName: string) {
    media = this.clean(media);

    return await this.save(mediaDirectory, fileName, media);
  }

  private async save(
    folder_name: string,
    file_name: string,
    file_data: string,
    config?: {
      format: 'jpg' | 'png';
      overwrite?: boolean;
      transformation?: object[];
    },
  ) {
    file_name = file_name
      .split(/\s+/g)
      .join('-')
      .split(/[^a-zA-Z ]/g)
      .join('-')
      .toLowerCase();

    try {
      const data = await cloudinary.uploader.upload(file_data, {
        ...config,
        public_id: `${env}/${folder_name}/${file_name}`,
      });
      return { status: true, data: data.secure_url };
    } catch (error) {
      console.error(error, `${this.traceId} Could not upload media to cloudinary`, { folder_name, file_name, file_data, config });
      return { status: false, data: null };
    }
  }
  private clean(media_base64: string) {
    return media_base64.split(',').length > 1 ? media_base64 : 'data:image/png;base64,' + media_base64;
  }
}

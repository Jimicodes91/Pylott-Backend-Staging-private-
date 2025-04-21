import { injectable } from 'tsyringe';

import { CreateMetadataType } from '@/shared/types/dto/documents.dto';
import { UserModelType } from '@/models';
import { MetadataRepository } from '@/repositories';
import { MetadataType } from '@/shared/enums';

@injectable()
export class MetadataService {
  private traceId = '[Metadata Service]';

  constructor(private readonly metadataRepository: MetadataRepository) {}

  async createDocumentType(user: UserModelType, payload: CreateMetadataType) {
    return this.createMetadata(user, payload, MetadataType.DOCUMENT, 'Document');
  }

  async createTaskType(user: UserModelType, payload: CreateMetadataType) {
    return this.createMetadata(user, payload, MetadataType.TASK, 'Task');
  }

  async createEventType(user: UserModelType, payload: CreateMetadataType) {
    return this.createMetadata(user, payload, MetadataType.EVENT, 'Event');
  }

  async getDocumentTypes(user: UserModelType) {
    return this.fetchMetadataByType(user, MetadataType.DOCUMENT, 'Document');
  }

  async getTaskTypes(user: UserModelType) {
    return this.fetchMetadataByType(user, MetadataType.TASK, 'Task');
  }

  async getEventTypes(user: UserModelType) {
    return this.fetchMetadataByType(user, MetadataType.EVENT, 'Event');
  }

  /**
   * Generic method to fetch metadata by type
   */
  private async fetchMetadataByType(user: UserModelType, type: MetadataType, typeName: string) {
    try {
      const metadata = await this.metadataRepository.findByType(user.company_id, type);

      return {
        status: true,
        message: `${typeName} types fetched successfully`,
        data: metadata,
      };
    } catch (error: any) {
      console.log(`${this.traceId} Error occurred fetching ${typeName.toLowerCase()} types ===> ${JSON.stringify({ err_msg: error?.message })}`);
      return {
        status: false,
        message: 'An error occurred, please try again later',
        data: [],
      };
    }
  }

  /**
   * Generic method to create metadata of any type
   */
  private async createMetadata(user: UserModelType, payload: CreateMetadataType, type: MetadataType, typeName: string) {
    try {
      payload.name = payload.name.trim();

      const queryData = {
        company_id: user.company_id,
        name: payload.name,
        type,
      };

      const isNameTaken = await this.metadataRepository.findOne(queryData);

      if (isNameTaken)
        return {
          status: false,
          message: `${typeName} type with name already exists`,
        };

      await this.metadataRepository.create({
        ...queryData,
        description: payload?.description ?? '',
      });

      return {
        status: true,
        message: `${typeName} type created successfully`,
      };
    } catch (error: any) {
      console.log(`${this.traceId} Error occurred creating ${typeName.toLowerCase()} type ===> ${JSON.stringify({ payload, err_msg: error?.message })}`);
      return {
        status: false,
        message: 'An error occurred, please try again later',
      };
    }
  }
}

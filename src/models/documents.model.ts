import { ModelObject } from 'objection';

import { MetadataType } from '@/shared/enums';
import { ModelsRelationMapping } from '@/shared/types/models.type';
import BaseModel from './base.model';

export class Documents extends BaseModel {
  static tableName = 'documents';

  company_id: string;
  project_id: string;
  task_id?: string;
  type: MetadataType;
  description: string;

  static relationMappings = (): ModelsRelationMapping => ({});
}

export type DocumentsModelType = ModelObject<Documents>;

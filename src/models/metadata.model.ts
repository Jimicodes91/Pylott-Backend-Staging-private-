import { ModelObject } from 'objection';

import { MetadataType } from '@/shared/enums';
import { ModelsRelationMapping } from '@/shared/types/models.type';
import BaseModel from './base.model';

export class Metadata extends BaseModel {
  static tableName = 'metadata';

  company_id: string;
  project_id: string;
  name: string;
  is_system: boolean;
  type: MetadataType;
  description: string;

  static relationMappings = (): ModelsRelationMapping => ({});
}

export type MetadataModelType = ModelObject<Metadata>;

import { Model, ModelObject } from 'objection';

import { Attachments } from './document_attachments.model';

import { MetadataType } from '@/shared/enums';
import { ModelsRelationMapping } from '@/shared/types/models.type';
import BaseModel from './base.model';

export class Documents extends BaseModel {
  static tableName = 'documents';

  company_id: string;
  project_id: string;
  document_type_id?: string;
  name: string;
  task_id?: string;
  note_id?: string;
  type: MetadataType;
  description: string;
  is_visible_to_client: boolean;
  is_document_request: boolean;
  issue_date?: string;
  expiry_date?: string;
  does_not_expire: boolean;

  attachments: Attachments[];

  static relationMappings = (): ModelsRelationMapping => ({
    attachments: {
      modelClass: Attachments,
      relation: Model.HasManyRelation,
      join: { from: 'documents.id', to: 'attachments.document_id' },
    },
  });
}

export type DocumentsModelType = ModelObject<Documents>;

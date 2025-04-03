import { ModelObject } from 'objection';

import { ModelsRelationMapping } from '@/shared/types/models.type';
import BaseModel from './base.model';

export class DocumentRequests extends BaseModel {
  static tableName = 'document_requests';

  company_id: string;
  project_id: string;
  document_type_id?: string;
  assignee_id: string;
  name: string;
  task_id?: string;
  description: string;
  is_visible_to_client: boolean;

  static relationMappings = (): ModelsRelationMapping => ({});
}

export type DocumentRequestsModelType = ModelObject<DocumentRequests>;

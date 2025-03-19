import { ModelObject } from 'objection';

import { ModelsRelationMapping } from '@/shared/types/models.type';
import BaseModel from './base.model';

export class ProjectMembers extends BaseModel {
  static tableName = 'project_members';

  company_id: string;
  project_id: string;
  user_id: string;

  static relationMappings = (): ModelsRelationMapping => ({});
}

export type ProjectMemebersModelType = ModelObject<ProjectMembers>;

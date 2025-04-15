import { ModelObject } from 'objection';
import BaseModel from './base.model';
import { ProjectFormField } from './project_form_fields.model';
import { ModelsRelationMapping } from '@/shared/types/models.type';

export class ProjectForm extends BaseModel {
  static tableName = 'project_forms';

  company_id: string;
  name: string;
  is_active: boolean;

  fields: Array<ProjectFormField>;

  static relationMappings = (): ModelsRelationMapping => ({
    fields: {
      relation: BaseModel.HasManyRelation,
      modelClass: ProjectFormField,
      join: {
        from: 'project_forms.id',
        to: 'project_form_fields.form_id',
      },
    },
  });
}

export type ProjectFormModelType = ModelObject<ProjectForm>;

import { ModelObject } from 'objection';
import BaseModel from '@/models/base.model';

export class FormTemplate extends BaseModel {
  static tableName = 'form_templates';

  company_id: string;
  name: string;
  description: string | null;
  status: 'draft' | 'published' | 'archived';
  created_by: string;

  static get relationMappings() {
    return {
      fields: {
        relation: BaseModel.HasManyRelation,
        modelClass: require('./form-field.model').FormField,
        join: {
          from: 'form_templates.id',
          to: 'form_fields.template_id',
        },
      },
      versions: {
        relation: BaseModel.HasManyRelation,
        modelClass: require('./form-version.model').FormVersion,
        join: {
          from: 'form_templates.id',
          to: 'form_versions.template_id',
        },
      },
    };
  }
}

export type FormTemplateModelType = ModelObject<FormTemplate>;

import { ModelObject } from 'objection';
import BaseModel from '@/models/base.model';

export class FormVersion extends BaseModel {
  static tableName = 'form_versions';

  template_id: string;
  version_number: number;
  fields_snapshot: any;
  created_by: string;
}

export type FormVersionModelType = ModelObject<FormVersion>;

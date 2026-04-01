import { ModelObject } from 'objection';
import BaseModel from '@/models/base.model';

export class FormField extends BaseModel {
  static tableName = 'form_fields';

  template_id: string;
  type: string;
  label: string;
  placeholder: string | null;
  help_text: string | null;
  sort_order: number;
  validation_rules: any;
  conditional_rule: any;
  pre_fill_source: string | null;
  options: any;
  file_config: any;
}

export type FormFieldModelType = ModelObject<FormField>;

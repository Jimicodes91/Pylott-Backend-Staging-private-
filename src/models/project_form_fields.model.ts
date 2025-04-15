import { ModelObject } from 'objection';
import slugify from 'slugify';

import BaseModel from './base.model';

export class ProjectFormField extends BaseModel {
  static tableName = 'project_form_fields';

  form_id: string;
  company_id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'select' | 'document';
  is_required: boolean;
  is_custom: boolean;
  is_multiple?: boolean;
  max_files?: number; // For document fields
  accepted_types?: string; // e.g. "image/*,.pdf,.docx"
  options?: string[];
  default_value?: string;
  sort_order: number;
  slug: string;

  async $beforeInsert() {
    super.$beforeInsert();
    this.slug = this.generateSlug(this.name);
  }

  async $beforeUpdate() {
    super.$beforeUpdate();
    if (this.name && this.name !== this.constructor.name) {
      this.slug = this.generateSlug(this.name);
    }
  }

  private generateSlug(name: string): string {
    return slugify(name, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g,
      replacement: '_',
    });
  }
}

export type ProjectFormFieldModelType = ModelObject<ProjectFormField>;

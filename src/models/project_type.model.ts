import slugify from 'slugify';
import { ModelObject } from 'objection';

import { ModelsRelationMapping } from '@/shared/types/models.type';
import BaseModel from './base.model';

export class ProjectType extends BaseModel {
  static tableName = 'project_types';

  company_id: string;
  name: string;
  slug: string;
  is_system: boolean;

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
    });
  }

  static relationMappings = (): ModelsRelationMapping => ({});
}

export type ProjectTypeModelType = ModelObject<ProjectType>;

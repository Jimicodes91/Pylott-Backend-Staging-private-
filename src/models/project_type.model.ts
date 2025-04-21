import { ModelObject } from 'objection';
import slugify from 'slugify';

import { ModelsRelationMapping } from '@/shared/types/models.type';
import BaseModel from './base.model';
import { Project } from './project.model';
import { Milestones } from './milestones.model';
// import { FieldTypeEnum } from '@/shared/enums';

export class ProjectType extends BaseModel {
  static tableName = 'project_types';

  company_id: string;
  name: string;
  slug: string;
  is_system: boolean;
  // custom_fields?: Array<{
  //   name: string;
  //   field_key: string;
  //   field_type: FieldTypeEnum;
  //   is_required: boolean;
  //   order: number;
  //   options?: any;
  // }>;

  milestones: Milestones[];

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

  static jsonSchema = {
    type: 'object',
    required: ['company_id', 'name'],
    properties: {
      id: { type: 'string' },
      company_id: { type: 'string' },
      name: { type: 'string', minLength: 1, maxLength: 255 },
      // custom_fields: {
      //   type: 'array',
      //   items: {
      //     type: 'object',
      //     properties: {
      //       name: { type: 'string', minLength: 1 },
      //       field_key: { type: 'string', minLength: 1 },
      //       field_type: { enum: Object.values(FieldTypeEnum) },
      //       is_required: { type: 'boolean' },
      //       order: { type: 'number' },
      //       options: { type: ['object', 'array', 'null'] },
      //     },
      //     required: ['name', 'field_key', 'field_type', 'order'],
      //   },
      // },
    },
  };

  static relationMappings = (): ModelsRelationMapping => ({
    projects: {
      relation: BaseModel.HasManyRelation,
      modelClass: Project,
      join: {
        from: 'project_types.id',
        to: 'projects.project_type_id',
      },
    },
    milestones: {
      relation: BaseModel.HasManyRelation,
      modelClass: Milestones,
      join: {
        from: 'project_types.id',
        to: 'milestones.project_type_id',
      },
    },
  });
}

export type ProjectTypeModelType = ModelObject<ProjectType>;

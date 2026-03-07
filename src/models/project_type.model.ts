import { ModelObject } from 'objection';
import slugify from 'slugify';

import { ModelsRelationMapping } from '@/shared/types/models.type';
import BaseModel from './base.model';
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
  projects: Array<any>;

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

  static get relationMappings() {
    return {
      projects: {
        relation: BaseModel.HasManyRelation,
        modelClass: __dirname + '/project.model',
        join: {
          from: 'project_types.id',
          to: 'projects.project_type_id',
        },
      },
      milestones: {
        relation: BaseModel.HasManyRelation,
        modelClass: require('./milestones.model').Milestones,
        join: {
          from: 'project_types.id',
          to: 'milestones.project_type_id',
        },
      },
    };
  }
}

export type ProjectTypeModelType = ModelObject<ProjectType>;

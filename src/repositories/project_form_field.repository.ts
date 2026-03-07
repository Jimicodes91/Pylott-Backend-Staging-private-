import { injectable } from 'tsyringe';

import BaseRepository from './base.repository';
import { ProjectFormField, ProjectFormFieldModelType } from '@/models/project_form_fields.model';

@injectable()
export class ProjectFormFieldRepository extends BaseRepository<ProjectFormFieldModelType, ProjectFormField> {
  constructor() {
    super(ProjectFormField);
  }

  async getMaxOrder(form_id: string): Promise<number> {
    const result = await this.model.query().where({ form_id }).max('sort_order as maxOrder').first();

    return result['maxOrder'] || 0;
  }
}

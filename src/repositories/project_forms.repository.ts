import { injectable } from 'tsyringe';

import BaseRepository from './base.repository';
import { ProjectForm, ProjectFormModelType } from '@/models/project_forms.model';

@injectable()
export class ProjectFormsRepository extends BaseRepository<ProjectFormModelType, ProjectForm> {
  constructor() {
    super(ProjectForm);
  }

  async getCompanyForm(company_id: string) {
    return this.model.query().where({ company_id, deleted_at: null }).withGraphFetched('fields').first();
  }
}

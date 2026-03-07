import { injectable } from 'tsyringe';

import BaseRepository from './base.repository';
import { ProjectSettings, ProjectSettingsModelType } from '@/models/project_settings.model';

@injectable()
export class ProjectSettingsRepository extends BaseRepository<ProjectSettingsModelType, ProjectSettings> {
  constructor() {
    super(ProjectSettings);
  }

  public async getOne(query_identifier: Partial<ProjectSettingsModelType>) {
    return await this.model.query().where(query_identifier).orderBy('created_at', 'DESC').whereNull('deleted_at').first();
  }
}

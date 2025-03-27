import { injectable } from 'tsyringe';

import BaseRepository from './base.repository';
import { ProjectSettings, ProjectSettingsModelType } from '@/models';

@injectable()
export class ProjectSettingsRepository extends BaseRepository<ProjectSettingsModelType, ProjectSettings> {
  constructor() {
    super(ProjectSettings);
  }
}

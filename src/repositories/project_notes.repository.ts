import { injectable } from 'tsyringe';

import BaseRepository from './base.repository';
import { ProjectNotes, ProjectNotesModelType } from '@/models';

@injectable()
export class ProjectNotesRepository extends BaseRepository<ProjectNotesModelType, ProjectNotes> {
  constructor() {
    super(ProjectNotes);
  }
}

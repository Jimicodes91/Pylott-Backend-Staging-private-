import { injectable } from 'tsyringe';

import BaseRepository from './base.repository';
import { ProjectNotes, ProjectNotesModelType } from '@/models';

@injectable()
export class ProjectNotesRepository extends BaseRepository<ProjectNotesModelType, ProjectNotes> {
  constructor() {
    super(ProjectNotes);
  }

  async getNoteDetails(company_id: string, project_id: string, note_id: string) {
    return await this.model
      .query()
      .where({ company_id, project_id, id: note_id, deleted_at: null })
      .withGraphFetched({ document: { attachments: true }, author: true })
      .first();
  }

  async getAllNotes(company_id: string, project_id: string) {
    return await this.model
      .query()
      .where({ company_id, project_id, deleted_at: null })
      .withGraphFetched({ document: { attachments: true }, author: true });
  }
}

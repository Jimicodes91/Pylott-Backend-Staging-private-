import { injectable } from 'tsyringe';

import { NativeformsSubmission, NativeformsSubmissionModelType } from '@/models/nativeforms_submission.model';
import BaseRepository from './base.repository';

@injectable()
export class NativeformsSubmissionRepository extends BaseRepository<NativeformsSubmissionModelType, NativeformsSubmission> {
  constructor() {
    super(NativeformsSubmission);
  }

  async findByProject(projectId: string) {
    return this.model.query().where({ project_id: projectId }).whereNull('deleted_at').orderBy('submitted_at', 'desc');
  }

  async findBySubmissionId(submissionId: string) {
    return this.model.query().where({ submission_id: submissionId }).first();
  }

  async checkSubmission(formLinkId: string, projectId: string) {
    const submission = await this.model.query().where({ form_link_id: formLinkId, project_id: projectId }).whereNull('deleted_at').first();

    return submission ? { exists: true, submitted_at: submission.submitted_at } : { exists: false };
  }
}

import { injectable } from 'tsyringe';

import { FormLink, FormLinkModelType } from '@/models/form_link.model';
import BaseRepository from './base.repository';

@injectable()
export class FormLinkRepository extends BaseRepository<FormLinkModelType, FormLink> {
  constructor() {
    super(FormLink);
  }

  async findByOrgActive(organizationId: string) {
    return this.model.query().where({ organization_id: organizationId }).whereNull('deleted_at').orderBy('sort_order', 'asc').orderBy('created_at', 'asc');
  }

  async findByProjectContext(organizationId: string, projectTypeId?: string, milestoneId?: string) {
    const query = this.model.query().where({ organization_id: organizationId }).whereNull('deleted_at');

    // If project_type_id or milestone_id are provided, filter by them
    if (projectTypeId || milestoneId) {
      query.where(function () {
        if (projectTypeId) this.where('project_type_id', projectTypeId);
        if (milestoneId) this.orWhere('milestone_id', milestoneId);
      });
    }

    return query.orderBy('sort_order', 'asc').orderBy('created_at', 'asc');
  }
}

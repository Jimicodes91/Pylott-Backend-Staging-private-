import { injectable } from 'tsyringe';

import BaseRepository from './base.repository';
import { ClientInviteRequest, ClientInviteRequestModelType } from '@/models';

@injectable()
export class ClientInviteRequestRepository extends BaseRepository<ClientInviteRequestModelType, ClientInviteRequest> {
  constructor() {
    super(ClientInviteRequest);
  }

  async getPendingByCompany(companyId: string) {
    return await this.model.query().where({ company_id: companyId, status: 'pending' }).whereNull('deleted_at').orderBy('created_at', 'desc');
  }

  async findPendingByContact(contactId: string) {
    return await this.model.query().where({ contact_id: contactId, status: 'pending' }).whereNull('deleted_at').first();
  }
}

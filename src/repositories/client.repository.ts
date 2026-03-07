import { injectable } from 'tsyringe';

import { Client, ClientModelType } from '@/models/client.model';
import BaseRepository from './base.repository';

@injectable()
export class ClientRepository extends BaseRepository<ClientModelType, Client> {
  constructor() {
    super(Client);
  }

  public async getClientWithDetails(clientId: string) {
    return this.model.query().findById(clientId).withGraphFetched('[user, projects]');
  }

  public async getClientsWhereIn(clientIds: [string]) {
    return this.model.query().whereIn('id', clientIds).whereNull('deleted_at').withGraphFetched('[user]');
  }

  public async getTopClients() {
    return this.model.query().whereNull('deleted_at').withGraphFetched('[user, projects]').orderBy('projects.length', 'desc').limit(10);
  }
  public async getClientById(userId: string) {
    return this.model.query().where('user_id', userId).whereNull('deleted_at').withGraphFetched('[user]');
  }
}

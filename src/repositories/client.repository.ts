import { injectable } from 'tsyringe';

import { Client, ClientModelType } from '@/models';
import BaseRepository from './base.repository';

@injectable()
export class ClientRepository extends BaseRepository<ClientModelType, Client> {
  constructor() {
    super(Client);
  }
}
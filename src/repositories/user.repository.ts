import { injectable } from 'tsyringe';

import { User, UserModelType } from '@/models';
import BaseRepository from './base.repository';

@injectable()
export class UserRepository extends BaseRepository<UserModelType, User> {
  constructor() {
    super(User);
  }
}

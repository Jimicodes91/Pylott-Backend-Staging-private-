import { injectable } from 'tsyringe';

import { User, UserModelType } from '@/models';
import BaseRepository from './base.repository';
import { UserRoles } from '@/shared/enums';

@injectable()
export class UserRepository extends BaseRepository<UserModelType, User> {
  constructor() {
    super(User);
  }

  // Add a new SysAdmin
  public async addSysAdmin(name: string, email: string, role: UserRoles.SUPER_ADMIN, password: string) {
    return this.create({ name, email, role, is_active: true, password });
  }

  // Deactivate a SysAdmin
  public async deactivateSysAdmin(userId: string) {
    return this.update({ id: userId }, { is_active: false });
  }
}

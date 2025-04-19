import { injectable } from 'tsyringe';

import { User, UserModelType } from '@/models';
import BaseRepository from './base.repository';
import { UserRoles } from '@/shared/enums';

@injectable()
export class UserRepository extends BaseRepository<UserModelType, User> {
  constructor() {
    super(User);
  }

  async findAllWhereIdIn(userIds: Array<string>) {
    return await this.model.query().whereIn('id', userIds);
  }

  async findUser(id: string) {
    return await this.model.query().where('id', id);
  }

  async findAllWhereEmailIn(emails: Array<string>) {
    return await this.model.query().whereIn('email', emails).whereNull('deleted_at');
  }

  // Add a new SysAdmin
  public async addSysAdmin(name: string, email: string, role: UserRoles.SUPER_ADMIN, password: string) {
    return this.create({ name, email, role, is_active: true, password });
  }

  // Deactivate a SysAdmin
  public async deactivateSysAdmin(userId: string) {
    return this.update({ id: userId }, { is_active: false });
  }
  public async getAllActiveUsers() {
    return this.findMany({ is_active: true });
  }
  public async countActiveUsers() {
    const result = await this.count({ is_active: true });
    return result.count;
  }
  public async getAllUsers() {
    return this.findMany({});
  }
  public async getAllAdmins() {
    return this.findMany({ role: UserRoles.SUPER_ADMIN });
  }

  async getUserDetails(id: string) {
    return await this.model.query().where({ id, deleted_at: null }).withGraphFetched({ company: true }).first();
  }

  async toggleUserStatus(id: string) {
    const user = await this.model.query().findById(id);
    if (!user) {
      return null;
    }
    return this.model.query().where({ id }).patch({ is_active: !user.is_active });
  }

  // In user.repository.ts
  public async getUsersByCompany(companyId: string) {
    return await this.model.query().where('company_id', companyId).whereNull('deleted_at').orderBy('created_at', 'desc');
  }
}

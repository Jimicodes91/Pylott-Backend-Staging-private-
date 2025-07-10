import { injectable } from 'tsyringe';

import BaseRepository from './base.repository';
import { UserCompany, UserCompanyModelType } from '@/models/user_company.model';
import { UserRoles } from '@/shared/enums';

@injectable()
export class UserCompanyRepository extends BaseRepository<UserCompanyModelType, UserCompany> {
  constructor() {
    super(UserCompany);
  }

  // Get all companies a user belongs to
  async getUserCompanies(userId: string) {
    return await this.model.query().where('user_id', userId).where('is_active', true).whereNull('deleted_at').withGraphFetched('company').orderBy('joined_at', 'desc');
  }

  // Check if user is already in a specific company
  async isUserInCompany(userId: string, companyId: string) {
    const userCompany = await this.model.query().where('user_id', userId).where('company_id', companyId).where('is_active', true).whereNull('deleted_at').first();

    return !!userCompany;
  }

  // Get user's role in a specific company
  async getUserRoleInCompany(userId: string, companyId: string) {
    const userCompany = await this.model.query().where('user_id', userId).where('company_id', companyId).where('is_active', true).whereNull('deleted_at').first();

    return userCompany?.role || null;
  }

  // Add user to a company
  async addUserToCompany(userId: string, companyId: string, role: UserRoles, invitedBy?: string) {
    return await this.create({
      user_id: userId,
      company_id: companyId,
      role,
      is_active: true,
      invited_by: invitedBy,
      joined_at: new Date(),
    });
  }

  // Remove user from a company (soft delete)
  async removeUserFromCompany(userId: string, companyId: string) {
    return await this.update({ user_id: userId, company_id: companyId }, { is_active: false, deleted_at: new Date().toISOString() });
  }

  // Get all users in a company
  async getCompanyUsers(companyId: string) {
    return await this.model.query().where('company_id', companyId).where('is_active', true).whereNull('deleted_at').withGraphFetched('user').orderBy('joined_at', 'desc');
  }

  // Get user's primary company (for backward compatibility)
  async getUserPrimaryCompany(userId: string) {
    const userCompany = await this.model.query().where('user_id', userId).where('is_active', true).whereNull('deleted_at').withGraphFetched('company').orderBy('joined_at', 'asc').first();

    return userCompany?.company || null;
  }
}

import { CompanyRepository, UserRepository } from '@/repositories';
import { CompanySignupData } from '@/shared/interface/company';
import HttpError from '@/shared/utils/errorHandler';
import { inject, injectable } from 'tsyringe';

@injectable()
export class CompanyService {
  constructor(
    @inject(CompanyRepository) private companyRepository: CompanyRepository,
    @inject(UserRepository) private userRepository: UserRepository,
  ) {}

  public async createCompany(data: CompanySignupData, adminId: string) {
    try {
      // Add the admin ID to the company data
      const adminRole = await this.userRepository.getById(adminId);
      console.log('add', adminRole);
      if (adminRole.role !== 'ADMIN') {
        throw new HttpError('You are not allowed to access this resource', 400);
      }

      const companyData = {
        ...data,
        admin_id: adminId,
        is_active: true, // Default to active
      };

      // Create the company in the database
      const company = await this.companyRepository.create(companyData);
      await this.userRepository.update({ id: adminId }, { company_id: company.id });

      return company;
    } catch (error: any) {
      console.log(error);
      throw new HttpError(error.message || 'Failed to create company', 500);
    }
  }
}

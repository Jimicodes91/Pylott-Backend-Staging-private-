import { CompanyRepository, UserRepository } from '@/repositories';
import { SubscriptionRepository } from '@/repositories/subscription.repository';
import { CompanySignupData } from '@/shared/interface/company';
import HttpError from '@/shared/utils/errorHandler';
import { inject, injectable } from 'tsyringe';
import { AUDIT_TRAIL_ACTION } from '@/shared/enums';
import { AuditTrailService } from '@/modules/audit_trail/services/audit_trail.service';

@injectable()
export class CompanyService {
  constructor(
    @inject(CompanyRepository) private companyRepository: CompanyRepository,
    @inject(UserRepository) private userRepository: UserRepository,
    @inject(SubscriptionRepository) private subscriptionRepository: SubscriptionRepository,
    private readonly auditTrailService: AuditTrailService,
  ) {}

  public async createCompany(data: CompanySignupData, adminId: string) {
    try {
      // Add the admin ID to the company data
      if (!adminId) {
        throw new HttpError('Admin Id is required', 500);
      }

      const companyData = {
        ...data,
        admin_id: adminId,
        is_active: true, // Default to active
      };

      // Create the company in the database
      const company = await this.companyRepository.create(companyData);
      await this.userRepository.update({ id: adminId }, { company_id: company.id });

      // Log company creation activity
      this.auditTrailService.createEvent(
        AUDIT_TRAIL_ACTION.COMPANY_CREATED,
        {
          user_id: adminId,
          company_id: company.id,
          description: 'Company created',
          entity_description: `Company ${company.name} was created`,
          entity_id: company.id,
        },
        '',
      );

      return company;
    } catch (error: any) {
      console.log(error);
      throw new HttpError(error.message || 'Failed to create company', 500);
    }
  }

  public async getCompanySubscription(companyId: string) {
    try {
      if (!companyId) {
        throw new HttpError('Company ID is required', 400);
      }

      // Get the subscription with plan details
      const subscription = await this.subscriptionRepository.getActiveSubscriptionByCompanyId(companyId);

      if (!subscription) {
        throw new HttpError('No active subscription found for this company', 404);
      }

      // Get active users count for the company
      const activeUsersCount = await this.userRepository.getActiveUserCountByCompanyId(companyId);

      // Calculate pricing
      let totalMonthlyPrice = subscription.planDetails?.price || 0;

      if (subscription.planDetails?.price_per_seat) {
        totalMonthlyPrice = (subscription.planDetails.price || 0) * activeUsersCount;
      }

      return {
        subscription: {
          id: subscription.id,
          plan: subscription.plan,
          status: subscription.status,
          current_period_start: subscription.current_period_start,
          current_period_end: subscription.current_period_end,
          cancel_at_period_end: subscription.cancel_at_period_end,
        },
        planDetails: {
          name: subscription.planDetails?.name,
          display_name: subscription.planDetails?.display_name,
          price: subscription.planDetails?.price,
          price_per_seat: subscription.planDetails?.price_per_seat,
          currency: subscription.planDetails?.currency || 'USD',
          features: subscription.planDetails?.features,
          is_active: subscription.planDetails?.is_active,
        },
        usage: {
          active_users_count: activeUsersCount,
          price_per_seat: subscription.planDetails?.price || 0,
          total_monthly_price: totalMonthlyPrice,
        },
      };
    } catch (error: any) {
      console.error('Error getting company subscription:', error);
      throw new HttpError(error.message || 'Failed to get company subscription', error.statusCode || 500);
    }
  }
}

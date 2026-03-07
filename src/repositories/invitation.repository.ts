import { injectable } from 'tsyringe';
import { Invitation, InvitationModelType } from '@/models/invitation.model';
import BaseRepository from './base.repository';

@injectable()
export class InvitationRepository extends BaseRepository<InvitationModelType, Invitation> {
  constructor() {
    super(Invitation);
  }

  async findByToken(token: string): Promise<Invitation | null> {
    return this.findOne({ invitation_token: token });
  }

  async findByEmailAndCompany(email: string, companyId: string): Promise<Invitation | null> {
    return this.findOne({
      email,
      company_id: companyId,
      status: 'PENDING',
    });
  }

  async markAsAccepted(id: string): Promise<void> {
    await this.update({ id }, { status: 'ACCEPTED' });
  }

  async markAsExpired(id: string): Promise<void> {
    await this.update({ id }, { status: 'EXPIRED' });
  }

  async getExpiredInvitations(): Promise<Invitation[]> {
    return this.findMany({
      status: 'PENDING',
      token_expires: { '<': Date.now() } as any,
    });
  }

  // Get all pending invitations for a company
  async getPendingInvitationsByCompany(companyId: string): Promise<Invitation[]> {
    return this.findMany({
      company_id: companyId,
      status: 'PENDING',
    });
  }

  // Get invitation by email and company (including any status)
  async findByEmailAndCompanyAnyStatus(email: string, companyId: string): Promise<Invitation | null> {
    return this.findOne({
      email,
      company_id: companyId,
    });
  }
}

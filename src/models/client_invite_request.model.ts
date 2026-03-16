import { ModelObject } from 'objection';

import BaseModel from './base.model';

export type ClientInviteRequestStatus = 'pending' | 'approved' | 'rejected';

export class ClientInviteRequest extends BaseModel {
  static tableName = 'client_invite_requests';

  contact_id: string;
  company_id: string;
  requested_by_user_id: string;
  status: ClientInviteRequestStatus;
  approved_by_user_id: string | null;
  approved_at: string | null;
}

export type ClientInviteRequestModelType = ModelObject<ClientInviteRequest>;

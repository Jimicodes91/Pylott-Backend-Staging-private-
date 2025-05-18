import { ModelObject } from 'objection';
import BaseModel from './base.model';

export class OrgFinance extends BaseModel {
  static tableName = 'org_finance';

  client_name: string;
  project_title: string;
  total_project_cost: string;
  amount_paid: string;
  outstanding_balance: string;
  next_payment_due_date: Date;
  payment_status: string;
  organization_id: string;

  has_paid: boolean;
  payment_proof_url: string;
  payment_date: Date;

  static relationMappings = () => ({});
}

export type OrgFinanceModelType = ModelObject<OrgFinance>;

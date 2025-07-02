import { ModelObject } from 'objection';
import BaseModel from './base.model';
import { OrgFinance } from './org-finance.model';

export class OrgFinancePayment extends BaseModel {
  static tableName = 'org_finance_payments';

  org_finance_id: string;
  amount_paid: string;
  payment_proof_url?: string;
  payment_date: Date;
  notes?: string;
  total?: number;
  payment_method?: string;

  static relationMappings = () => ({
    orgFinance: {
      relation: BaseModel.BelongsToOneRelation,
      modelClass: OrgFinance,
      join: {
        from: 'org_finance_payments.org_finance_id',
        to: 'org_finance.id',
      },
    },
  });
}

export type OrgFinancePaymentModelType = ModelObject<OrgFinancePayment>;

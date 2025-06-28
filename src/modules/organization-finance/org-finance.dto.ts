export interface MarkAsPaidDTO {
  amount_paid: string;
  payment_proof?: any;
}

export interface OrgFinanceDTO {
  client_name: string;
  project_title: string;
  total_project_cost: string;
  amount_paid: string;
  outstanding_balance: string;
  next_payment_due_date: Date;
  hasPaid?: boolean;
  payment_status?: string;
  organization_id?: string;
  payment_proof_url?: string;
  payment_date?: Date;
}

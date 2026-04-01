import { ModelObject } from 'objection';
import BaseModel from '@/models/base.model';

export class FormSubmission extends BaseModel {
  static tableName = 'form_submissions';

  template_id: string;
  version_number: number;
  task_id: string;
  client_id: string;
  project_id: string;
  company_id: string;
  submission_data: any;
  status: 'draft' | 'submitted';
  submitted_at: string | null;
}

export type FormSubmissionModelType = ModelObject<FormSubmission>;

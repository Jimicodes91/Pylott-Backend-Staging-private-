import { ModelObject } from 'objection';

import BaseModel from './base.model';

export class Contact extends BaseModel {
  static tableName = 'contacts';

  name: string;
  email: string;
  phone: string;
  organization: string;
  address: string;
  active_projects: string;
  total_projects: string;
}

export type ContactModelType = ModelObject<Contact>;

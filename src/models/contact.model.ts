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
  no_of_projects: string;
  closed_projects: string;
  assigne: string;
}

export type ContactModelType = ModelObject<Contact>;

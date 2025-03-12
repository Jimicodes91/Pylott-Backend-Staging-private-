import { ModelObject } from 'objection';

import { ModelsRelationMapping } from '@/shared/types/models.type';
import BaseModel from './base.model';

export class Client extends BaseModel {
	static tableName = 'clients';

	user_id: string;
	company_id: string;
	contact_person?: string;
	billing_address?: string;
	is_active?: boolean;

	static relationMappings = (): ModelsRelationMapping => ({});
}

export type ClientModelType = ModelObject<Client>;

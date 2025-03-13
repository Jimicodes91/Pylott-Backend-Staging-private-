import { ModelObject } from 'objection';

import BaseModel from './base.model';
import { ModelsRelationMapping } from '@/shared/types/models.type';

export class Consultant extends BaseModel {
	static tableName = 'consultants';

	user_id: string;
	company_id: string;
	skills?: string[];
	hourly_rate?: number;
	is_active?: boolean;

	static relationMappings = (): ModelsRelationMapping => ({});
}

export type ConsultantModelType = ModelObject<Consultant>;

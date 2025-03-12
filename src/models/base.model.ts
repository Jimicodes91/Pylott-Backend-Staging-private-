import dayjs from 'dayjs';
import Knex from 'knex';
const { v4: uuidv4 } = require('uuid');
import Objection from 'objection';

import knexConfig from '../../knexfile';
import { dateTimeFormat } from '@/shared/constants/date.constants';

Objection.Model.knex(Knex(knexConfig));

export default abstract class BaseModel extends Objection.Model {
	id: string;

	created_at: string;

	updated_at: string;

	deleted_at: string | null;

	static get idColumn() {
		return ['id'];
	}

	$beforeInsert(): void | Promise<any> {
		if (!this.id) {
			this.id = uuidv4();
		}

		if (!this.created_at) this.created_at = dayjs().format(dateTimeFormat);

		if (!this.updated_at) this.updated_at = dayjs().format(dateTimeFormat);
	}

	$beforeUpdate(): void | Promise<any> {
		if (!this.updated_at) this.updated_at = dayjs().format(dateTimeFormat);
	}
}

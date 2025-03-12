import Knex from 'knex';
import { Knex as IKnex } from 'knex/types';
import { Model } from 'objection';

import knexConfig from '../../knexfile';

let knex: IKnex;

export const dbConnect = () => {
	knex = Knex(knexConfig);

	Model.knex(knex);

	return knex;
};

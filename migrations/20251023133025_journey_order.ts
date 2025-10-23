import type { Knex } from 'knex';

const TABLE_NAME = 'milestones';
const COLUMN_NAME = 'order';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable(TABLE_NAME, (table) => {
		table.integer(COLUMN_NAME).nullable().defaultTo(0);
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable(TABLE_NAME, (table) => {
		table.dropColumn(COLUMN_NAME);
	});
}

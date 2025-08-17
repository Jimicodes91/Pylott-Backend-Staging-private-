import type { Knex } from 'knex';

const tableName = 'projects';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable(tableName, (table) => {
		table.string('country').nullable()
		table.string('currency').nullable()
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable(tableName, (table) => {
		table.dropColumn("country")
		table.dropColumn("currency")
	});
}

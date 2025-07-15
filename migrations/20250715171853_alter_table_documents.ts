import type { Knex } from 'knex';

const tableName = 'documents';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable(tableName, (table) => {
		table.boolean('is_document_request').defaultTo(false);
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable(tableName, (table) => {
		table.dropColumn('is_document_request');
	});
}

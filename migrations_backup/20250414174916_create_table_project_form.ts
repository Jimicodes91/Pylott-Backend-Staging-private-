import type { Knex } from 'knex';

const tableName = 'project_forms';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable(tableName, (table) => {
		table.uuid('id').primary();
		table.string('company_id').notNullable();
		table.string('name').notNullable();
		table.boolean('is_active').notNullable().defaultTo(true);
	  table.timestamps(true, true);
		table.timestamp('deleted_at').nullable();
		table.index(['company_id'], 'idx_project_forms_company_id');
	});

}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTable(tableName);
}

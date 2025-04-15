import type { Knex } from 'knex';

const tableName = 'project_form_fields';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable(tableName, (table) => {
		table.uuid('id').primary();
		table.string('form_id').notNullable();
		table.string('company_id').notNullable();
		table.string('name').notNullable();
		table.string('slug').notNullable();
		table.string('type').notNullable();
		table.boolean('is_required').notNullable().defaultTo(false);
		table.boolean('is_custom').notNullable().defaultTo(false);
		table.boolean('is_multiple').defaultTo(false);
		table.integer('max_files').unsigned();
		table.string('accepted_types');
		table.jsonb('options');
		table.string('default_value');
		table.integer('sort_order').notNullable().defaultTo(0);
	  table.timestamps(true, true);
		table.timestamp('deleted_at').nullable();

		table.index(['form_id'], 'idx_project_form_fields_form_id');
		table.index(['type'], 'idx_project_form_fields_type');
	});

}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTable(tableName);
}

import type { Knex } from 'knex';

const tableName = 'project_forms';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable(tableName, (table) => {
		table.uuid('id').primary();
		table.uuid('company_id').notNullable();
		table.uuid('project_type_id').notNullable();
		table.string('name').notNullable();
		table.text('description').notNullable();
		table.boolean('is_active').notNullable().defaultTo(true);
		table.uuid('created_by').notNullable();
		table.uuid('updated_by').nullable();
		table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
		table.timestamp('updated_at').nullable();
		table.timestamp('deleted_at').nullable();

		// Foreign key constraints
		table.foreign('project_type_id').references('id').inTable('project_types').onDelete('SET NULL');
		table.foreign('company_id').references('id').inTable('companies').onDelete('CASCADE');
		table.foreign('created_by').references('id').inTable('users').onDelete('CASCADE');
		table.foreign('updated_by').references('id').inTable('users').onDelete('SET NULL');

		// Indexes
		table.index(['company_id']);
		table.index(['project_type_id']);
		table.index(['is_active']);
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTable(tableName);
}

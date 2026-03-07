import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('projects', (table) => {
		table.jsonb('form_data').nullable();
		table.string("jurisdiction").nullable();
		table.string("package").nullable();
		table.string("visa_required").nullable();
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('projects', (table) => {
		table.dropColumn('form_data');
		table.dropColumn('jurisdiction');
		table.dropColumn('visa_required');
		table.dropColumn('package');
	});
}

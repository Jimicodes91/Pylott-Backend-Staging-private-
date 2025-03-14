import type { Knex } from 'knex';

const tableName = 'clients';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable(tableName, (table) => {
		table.increments('id').primary();
		table.integer('user_id').unsigned().notNullable().references('id').inTable('users');
		table.integer('company_id').unsigned().notNullable().references('id').inTable('companies');
		table.string('contact_person').nullable();
		table.string('billing_address').nullable();
		table.boolean('is_active').defaultTo(true);
		table.timestamps(true, true);
		table.timestamp('deleted_at').nullable();
	});
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTableIfExists(tableName);
}

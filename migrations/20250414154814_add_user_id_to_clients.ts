import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('clients', (table) => {
		table.uuid('user_id').notNullable(); // or .notNullable() if it's required
		table.foreign('user_id').references('id').inTable('users'); // if you want a foreign key constraint
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('clients', (table) => {
		table.dropColumn('user_id');
	});
}

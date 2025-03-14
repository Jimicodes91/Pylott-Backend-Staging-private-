import type { Knex } from 'knex';

const tableName = 'users';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable(tableName, (table) => {
		table.increments('id').primary();
		table.string('email').unique().index();
		table.string('pfp').nullable();
		table.string('password').notNullable();
		table.string('name').nullable();
		table.enum('role', ['admin', 'user', 'client', 'consultant']).defaultTo('user');
		table.integer('company_id').unsigned().nullable().references('id').inTable('companies');
		table.boolean('is_blocked').defaultTo(false);
		table.boolean('is_verified').defaultTo(false);
		table.string('timezone').nullable();
		table.string('language').defaultTo('en');
		table.string('currency').defaultTo('USD');
		table.boolean('is_active').defaultTo(true);
		table.timestamp('last_login').nullable();
		table.string('verification_token').nullable();
		table.bigInteger('token_expires').nullable();
		table.string('password_setup_token').nullable();
		table.bigInteger('password_setup_token_expires').nullable();
		table.timestamps(true, true);
		table.timestamp('deleted_at').nullable();
	});
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTableIfExists(tableName);
}

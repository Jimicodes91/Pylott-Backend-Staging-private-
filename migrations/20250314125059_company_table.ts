import type { Knex } from 'knex';

const tableName = 'companies';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable(tableName, (table) => {
	
		table.integer('admin_id').unsigned().references('id').inTable('users');
		table.string('name').notNullable();
		table.string('industry_type').notNullable();
		table.string('size').notNullable();
		table.string('country').notNullable();
		table.string('address').notNullable();
		table.string('city').notNullable();
		table.string('postal_code').nullable();
		table.boolean('is_active').defaultTo(true);
		table.timestamps(true, true);
		table.timestamp('deleted_at').nullable();
	});
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTableIfExists(tableName);
}

import type { Knex } from 'knex';

const tableName = 'projects';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable(tableName, (table) => {
    table.timestamp('milestone_start_date').nullable().after("milestone_id");
		table.string("milestone_status").nullable().after("milestone_start_date");
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable(tableName, (table) => {
		table.dropColumn('milestone_start_date');
		table.dropColumn('milestone_status');
	});
}

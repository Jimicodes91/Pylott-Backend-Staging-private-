import type { Knex } from "knex";

const tableName = 'project_form_fields';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable(tableName, (table) => {
		table.string('api_locator').nullable().defaultTo(null).after('slug');
	});
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable(tableName, (table) => {
    table.dropColumn('api_locator');
  })
}


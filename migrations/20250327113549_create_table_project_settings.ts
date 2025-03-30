import type { Knex } from "knex";

const tableName = 'project_settings';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTableIfNotExists(tableName, (table) => {
    table.string('id').primary();
    table.string('company_id').notNullable().index();
    table.string('project_id').notNullable().index();
    table.boolean('client_can_view_task').defaultTo(false);
    table.boolean('client_can_view_documents').defaultTo(false);
    table.boolean('client_can_view_notes').defaultTo(false);
    table.boolean('client_can_view_activity').defaultTo(false);
    table.timestamps(true, true);
    table.timestamp('deleted_at').nullable();
  });
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists(tableName);
}


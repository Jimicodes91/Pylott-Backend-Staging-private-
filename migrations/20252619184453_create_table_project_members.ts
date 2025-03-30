import type { Knex } from "knex";

const tableName = "project_members";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTableIfNotExists(tableName, (table) => {
    table.string('id').primary();
    table.string('project_id').notNullable().index();
    table.string('company_id').notNullable().index();
    table.string('added_by').notNullable().index();
    table.string('user_id').notNullable().index();
    table.boolean('is_visible_to_client');
    table.timestamps(true, true);
    table.timestamp('deleted_at').nullable();
  });
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists(tableName);
}


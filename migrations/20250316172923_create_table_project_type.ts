import type { Knex } from "knex";

const tableName = "project_types";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTableIfNotExists(tableName, table => {
    table.string('id').primary();
    table.string("company_id").notNullable().index();
    table.string("name").notNullable();
    table.string("slug").nullable();
    table.boolean("is_system").nullable().defaultTo(false);
    table.timestamps(true, true);
    table.timestamp('deleted_at').nullable();
  })
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists(tableName);
}


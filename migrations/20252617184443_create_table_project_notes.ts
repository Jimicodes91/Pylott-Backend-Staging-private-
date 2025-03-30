import type { Knex } from "knex";

const tableName = "project_notes";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(tableName, (table) => {
    table.string('id').primary();
    table.string('project_id').notNullable().index();
    table.string('author_id').notNullable().index();
    table.string('company_id').notNullable().index();
    table.text('content');
    table.string("metadata");
    table.timestamps(true, true);
    table.timestamp('deleted_at').nullable();
  });
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable(tableName);
}


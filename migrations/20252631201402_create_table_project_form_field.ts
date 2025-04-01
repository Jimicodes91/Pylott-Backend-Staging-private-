import type { Knex } from "knex";

const tableName = "project_form_fields"


export async function up(knex: Knex): Promise<void> {
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable(tableName);
}


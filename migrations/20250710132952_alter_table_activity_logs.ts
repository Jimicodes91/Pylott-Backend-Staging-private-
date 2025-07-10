import type { Knex } from "knex";

const tableName = "activity_logs";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable(tableName, (table) => {
    table.string('project_id').nullable().alter();;
  });
}


export async function down(knex: Knex): Promise<void> {
}


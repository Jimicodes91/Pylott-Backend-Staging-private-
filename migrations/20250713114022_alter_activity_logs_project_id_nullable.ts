import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('activity_logs', (table) => {
    table.string('project_id', 36).nullable().alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('activity_logs', (table) => {
    table.string('project_id', 36).notNullable().alter();
  });
}


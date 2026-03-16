import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('milestones', (table) => {
    table.integer('order').nullable().defaultTo(0);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('milestones', (table) => {
    table.dropColumn('order');
  });
}

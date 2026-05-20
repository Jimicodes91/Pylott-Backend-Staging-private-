import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('activity_logs', (table) => {
    table.text('entity').alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('activity_logs', (table) => {
    table.string('entity', 255).alter();
  });
}

import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('contacts', (table) => {
    // Add new JSON column for assigned_to (array of objects)
    table.json('assigned_to').nullable();
    
    // If you want to keep the old assigne column but mark it as deprecated
    // table.json('assigne').nullable().alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('contacts', (table) => {
    table.dropColumn('assigned_to');
  });
}
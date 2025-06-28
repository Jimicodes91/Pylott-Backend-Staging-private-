import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.alterTable('contacts', (table) => {
        table.json('assigne').nullable().alter(); // Changed to nullable first
      })
      .then(() => {
        // Update existing records to have empty array if assigne is null
        return knex('contacts')
          .whereNull('assigne')
          .orWhere('assigne', '')
          .update({ assigne: JSON.stringify([]) });
      })
      .then(() => {
        // Now alter to not nullable
        return knex.schema.alterTable('contacts', (table) => {
          table.json('assigne').notNullable().alter();
        });
      });
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.alterTable('contacts', (table) => {
        table.string('assigne').alter();
      });
}


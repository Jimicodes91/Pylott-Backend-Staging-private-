import type { Knex } from 'knex';

const tableName = 'clients';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(tableName, (table) => {
    // Use CHAR(36) for UUIDs
    table.string('id', 36).primary().notNullable();
  
    table.string('contact_person', 255).nullable(); 
    table.string('billing_address', 255).nullable(); 
    table.boolean('is_active').defaultTo(true); 
    table.timestamps(true, true); 
    table.timestamp('deleted_at').nullable(); 
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists(tableName);
}
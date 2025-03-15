import type { Knex } from 'knex';

const tableName = 'companies';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(tableName, (table) => {
    // Use CHAR(36) for UUIDs
    table.string('id', 36).primary().notNullable(); 
    table.string('name', 255).notNullable();
    table.string('industry_type', 255).notNullable(); 
    table.string('size', 255).notNullable(); 
    table.string('country', 255).notNullable(); 
    table.string('address', 255).notNullable(); 
    table.string('city', 255).notNullable(); 
    table.string('postal_code', 255).nullable(); 
    table.string('admin_id', 36).nullable().references('id').inTable('users'); 
    table.boolean('is_active').defaultTo(true); 
    table.timestamps(true, true); 
    table.timestamp('deleted_at').nullable(); 
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists(tableName);
}
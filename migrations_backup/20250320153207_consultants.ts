import type { Knex } from 'knex';

const tableName = 'consultants';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(tableName, (table) => {
    // Use CHAR(36) for UUIDs
    table.string('id', 36).primary().notNullable();
    table.string('user_id', 36).notNullable()
    table.string('company_id', 36).notNullable()
    table.json('skills').nullable();
    table.decimal('hourly_rate', 10, 2).nullable();
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true); 
    table.timestamp('deleted_at').nullable(); 
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists(tableName);
}
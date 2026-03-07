import type { Knex } from 'knex';

const tableName = 'projects';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable(tableName, (table) => {
    // Add client_contact_id field
    table.uuid('client_contact_id').nullable().after('client_id');
    
    // Add foreign key constraint
    table.foreign('client_contact_id').references('id').inTable('contacts').onDelete('SET NULL');
    
    // Add notes field (replaces description)
    table.text('notes').nullable().after('end_date');
    
    // Add index on client_contact_id for performance
    table.index('client_contact_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable(tableName, (table) => {
    table.dropForeign(['client_contact_id']);
    table.dropIndex(['client_contact_id']);
    table.dropColumn('client_contact_id');
    table.dropColumn('notes');
  });
}

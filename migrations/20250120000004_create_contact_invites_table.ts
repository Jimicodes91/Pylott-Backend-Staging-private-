import type { Knex } from 'knex';

const tableName = 'contact_invites';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(tableName, (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('(UUID())'));
    table.uuid('contact_id').notNullable();
    table.string('token', 64).notNullable().unique();
    table.enum('status', ['pending', 'approved', 'rejected', 'sent']).defaultTo('pending');
    table.timestamp('expires_at').notNullable();
    table.uuid('invited_by').notNullable();
    table.uuid('approved_by').nullable();
    table.timestamp('approved_at').nullable();
    table.timestamp('accepted_at').nullable();
    table.text('custom_message').nullable();
    table.timestamps(true, true);
    
    // Foreign keys
    table.foreign('contact_id').references('id').inTable('contacts').onDelete('CASCADE');
    table.foreign('invited_by').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('approved_by').references('id').inTable('users').onDelete('SET NULL');
    
    // Indexes for performance
    table.index('token');
    table.index('contact_id');
    table.index('expires_at');
    table.index('status');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists(tableName);
}

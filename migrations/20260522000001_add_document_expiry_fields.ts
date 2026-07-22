import type { Knex } from 'knex';

/**
 * Document Expiry Tracking — add expiry fields to documents and metadata tables.
 */
export async function up(knex: Knex): Promise<void> {
  // Add expiry fields to documents
  await knex.schema.alterTable('documents', (table) => {
    table.timestamp('issue_date').nullable();
    table.timestamp('expiry_date').nullable();
    table.boolean('does_not_expire').notNullable().defaultTo(false);
  });

  // Add requires_expiry config to metadata (document types)
  await knex.schema.alterTable('metadata', (table) => {
    table.boolean('requires_expiry').notNullable().defaultTo(false);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('documents', (table) => {
    table.dropColumn('issue_date');
    table.dropColumn('expiry_date');
    table.dropColumn('does_not_expire');
  });

  await knex.schema.alterTable('metadata', (table) => {
    table.dropColumn('requires_expiry');
  });
}

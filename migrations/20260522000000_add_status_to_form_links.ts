import type { Knex } from 'knex';

/**
 * NativeForms Phase 2 — Add status column to form_links for richer workflow.
 * Statuses: not_sent, sent, awaiting_client, submitted, under_review, completed
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('form_links', (table) => {
    table.string('status', 50).notNullable().defaultTo('not_sent');
  });

  // Add status and reviewed_at to submissions for tracking review workflow
  await knex.schema.alterTable('nativeforms_submissions', (table) => {
    table.string('status', 50).notNullable().defaultTo('submitted');
    table.string('reviewed_at').nullable();
    table.string('reviewed_by').nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('form_links', (table) => {
    table.dropColumn('status');
  });
  await knex.schema.alterTable('nativeforms_submissions', (table) => {
    table.dropColumn('status');
    table.dropColumn('reviewed_at');
    table.dropColumn('reviewed_by');
  });
}

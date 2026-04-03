import type { Knex } from 'knex';

/**
 * Fix project_tasks.status column type.
 * The staging DB may have this as an ENUM which rejects values like 'in_progress', 'draft', etc.
 * This migration forces it to VARCHAR(255) to accept all lifecycle statuses.
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('project_tasks', (table) => {
    table.string('status', 255).alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  // No-op — we don't want to revert to ENUM
}

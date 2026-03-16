import type { Knex } from 'knex';

const tableName = 'project_tasks';

/**
 * Requirement #11.2: Map existing tasks to "Inhouse" (is_visible_to_client = false)
 * so historical data remains intact and no migration breaks.
 */
export async function up(knex: Knex): Promise<void> {
  await knex(tableName).whereNull('is_visible_to_client').update({ is_visible_to_client: false });
}

export async function down(knex: Knex): Promise<void> {
  // No reversible change; we do not revert existing data.
}

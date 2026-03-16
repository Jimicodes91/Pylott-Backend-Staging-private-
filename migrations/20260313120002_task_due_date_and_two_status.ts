import type { Knex } from 'knex';

const tableName = 'project_tasks';

/**
 * Requirement #13: Task dates and status.
 * - Remove start_date; rename end_date to due_date.
 * - Only two states: Pending, Completed (map in_progress -> pending).
 */
export async function up(knex: Knex): Promise<void> {
  await knex(tableName).where('status', 'in_progress').update({ status: 'pending' });
  await knex.schema.alterTable(tableName, (table) => {
    table.dropColumn('start_date');
    table.renameColumn('end_date', 'due_date');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable(tableName, (table) => {
    table.timestamp('start_date').nullable();
    table.renameColumn('due_date', 'end_date');
  });
}

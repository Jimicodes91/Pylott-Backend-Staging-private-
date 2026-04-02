import type { Knex } from 'knex';

const tableName = 'project_tasks';

/**
 * Task Page Overhaul — make project_id and project_type_id nullable.
 *
 * Standalone tasks are not tied to a project or pipeline, so both
 * columns must accept NULL values.
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable(tableName, (table) => {
    table.string('project_id').nullable().alter();
    table.string('project_type_id').nullable().alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable(tableName, (table) => {
    table.string('project_id').notNullable().alter();
    table.string('project_type_id').notNullable().alter();
  });
}

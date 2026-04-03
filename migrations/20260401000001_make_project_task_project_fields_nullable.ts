import type { Knex } from 'knex';

const tableName = 'project_tasks';

/**
 * Task Page Overhaul — make project_id and project_type_id nullable.
 *
 * Standalone tasks are not tied to a project or pipeline, so both
 * columns must accept NULL values.
 */
export async function up(knex: Knex): Promise<void> {
  const hasProjectId = await knex.schema.hasColumn(tableName, 'project_id');
  const hasProjectTypeId = await knex.schema.hasColumn(tableName, 'project_type_id');

  await knex.schema.alterTable(tableName, (table) => {
    if (hasProjectId) table.string('project_id').nullable().alter();
    if (hasProjectTypeId) table.string('project_type_id').nullable().alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  const hasProjectId = await knex.schema.hasColumn(tableName, 'project_id');
  const hasProjectTypeId = await knex.schema.hasColumn(tableName, 'project_type_id');

  await knex.schema.alterTable(tableName, (table) => {
    if (hasProjectId) table.string('project_id').notNullable().alter();
    if (hasProjectTypeId) table.string('project_type_id').notNullable().alter();
  });
}

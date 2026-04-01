import type { Knex } from 'knex';

const tableName = 'project_tasks';

/**
 * Task Lifecycle Expansion — alter project_tasks table.
 *
 * Adds:
 *  - signing_status  VARCHAR nullable  (values enforced at app layer: sent, viewed, signed, completed)
 *  - form_config     JSON    nullable  (stores Information Request task config)
 *  - task_category_type VARCHAR nullable (values enforced at app layer: signing, information_request,
 *      document_upload, review, approval, meeting, follow_up)
 *
 * Uses VARCHAR instead of ENUM to avoid MySQL ENUM migration issues.
 * Application-layer validation enforces allowed values.
 *
 * Also adds indexes on task_category_type and status for filtering performance.
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable(tableName, (table) => {
    table.string('signing_status').nullable().after('status');
    table.json('form_config').nullable().after('signing_status');
    table.string('task_category_type').nullable().after('task_category');

    table.index('task_category_type', 'idx_project_tasks_category_type');
    table.index('status', 'idx_project_tasks_status');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable(tableName, (table) => {
    table.dropIndex('task_category_type', 'idx_project_tasks_category_type');
    table.dropIndex('status', 'idx_project_tasks_status');

    table.dropColumn('signing_status');
    table.dropColumn('form_config');
    table.dropColumn('task_category_type');
  });
}

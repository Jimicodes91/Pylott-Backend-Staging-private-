import type { Knex } from 'knex';

const tableName = 'task_comments';

/**
 * Task Lifecycle Expansion — create task_comments table.
 *
 * Stores comments/notes attached to individual tasks.
 * Supports soft-delete via deleted_at column.
 *
 * Foreign key on task_id → project_tasks.id with CASCADE delete
 * so comments are removed when the parent task is deleted.
 *
 * Indexes on task_id and company_id for query performance.
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(tableName, (table) => {
    table.string('id').primary();
    table.string('task_id').notNullable().index();
    table.string('author_id').notNullable();
    table.text('content').notNullable();
    table.string('company_id').notNullable().index();
    table.timestamps(true, true);
    table.timestamp('deleted_at').nullable();

    table.foreign('task_id').references('id').inTable('project_tasks').onDelete('CASCADE');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable(tableName);
}

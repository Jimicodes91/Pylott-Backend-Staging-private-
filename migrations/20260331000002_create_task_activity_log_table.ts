import type { Knex } from 'knex';

const tableName = 'task_activity_log';

/**
 * Task Lifecycle Expansion — create task_activity_log table.
 *
 * Records every significant task event: status changes, comments,
 * document uploads, signing status changes, etc.
 *
 * Uses a JSON metadata column for action-specific data.
 * Foreign key on task_id → project_tasks.id with CASCADE delete.
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(tableName, (table) => {
    table.string('id').primary();
    table.string('task_id').notNullable().index();
    table.string('action').notNullable();
    table.string('previous_value').nullable();
    table.string('new_value').nullable();
    table.string('user_id').notNullable();
    table.json('metadata').nullable();
    table.string('company_id').notNullable().index();
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.foreign('task_id').references('id').inTable('project_tasks').onDelete('CASCADE');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable(tableName);
}

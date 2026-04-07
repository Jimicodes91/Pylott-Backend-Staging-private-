import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn('project_task_assignees', 'project_id');
  if (hasColumn) {
    await knex.schema.alterTable('project_task_assignees', (table) => {
      table.string('project_id').nullable().alter();
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  // No-op: reverting nullable to NOT NULL could break existing data
}

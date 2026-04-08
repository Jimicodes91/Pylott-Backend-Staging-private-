import type { Knex } from 'knex';

/**
 * Add contact_id and priority columns to project_tasks table.
 *
 * - contact_id: nullable VARCHAR(255) — links a task to a contact
 * - priority: nullable VARCHAR(50) — Low, Medium, High, Urgent
 *
 * Idempotent: checks column existence before altering (staging DB may already have columns).
 */
export async function up(knex: Knex): Promise<void> {
  const hasCol = async (table: string, col: string) => knex.schema.hasColumn(table, col);

  if (!(await hasCol('project_tasks', 'contact_id'))) {
    await knex.schema.alterTable('project_tasks', (t) => {
      t.string('contact_id', 255).nullable();
    });
  }

  if (!(await hasCol('project_tasks', 'priority'))) {
    await knex.schema.alterTable('project_tasks', (t) => {
      t.string('priority', 50).nullable();
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasCol = async (table: string, col: string) => knex.schema.hasColumn(table, col);

  if (await hasCol('project_tasks', 'contact_id')) {
    await knex.schema.alterTable('project_tasks', (t) => t.dropColumn('contact_id'));
  }

  if (await hasCol('project_tasks', 'priority')) {
    await knex.schema.alterTable('project_tasks', (t) => t.dropColumn('priority'));
  }
}

import type { Knex } from 'knex';

const tableName = 'project_tasks';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable(tableName, (table) => {
    // Add task_category column - defaults to 'internal' so existing tasks are categorized
    table.enum('task_category', ['internal', 'external']).defaultTo('internal').notNullable().after('task_type_id');

    // Add required_information JSON column for external tasks
    table.json('required_information').nullable().after('is_visible_to_client');

    // Add additional_info JSON column for internal tasks
    table.json('additional_info').nullable().after('required_information');

    // Add index on task_category for filtering
    table.index('task_category', 'idx_project_tasks_task_category');
  });

  // Make name nullable (optional for internal tasks)
  // Using raw SQL because Knex .alter() with nullable can be unreliable on MySQL
  await knex.raw(`ALTER TABLE ${tableName} MODIFY COLUMN name VARCHAR(255) NULL`);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable(tableName, (table) => {
    table.dropIndex('task_category', 'idx_project_tasks_task_category');
    table.dropColumn('task_category');
    table.dropColumn('required_information');
    table.dropColumn('additional_info');
  });

  // Revert name to not nullable
  await knex.raw(`ALTER TABLE ${tableName} MODIFY COLUMN name VARCHAR(255) NOT NULL DEFAULT ''`);
}

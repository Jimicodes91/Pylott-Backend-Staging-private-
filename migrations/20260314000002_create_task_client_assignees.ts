import type { Knex } from 'knex';

const tableName = 'task_client_assignees';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(tableName, (table) => {
    table.string('id').primary();
    table.string('task_id').notNullable().index();
    table.string('client_id').notNullable().index();
    table.string('project_id').notNullable().index();
    table.string('company_id').notNullable().index();
    table.timestamps(true, true);
    table.timestamp('deleted_at').nullable();

    // Composite index for validation queries (check if client is assigned to task in project)
    table.index(['project_id', 'client_id'], 'idx_tca_project_client');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists(tableName);
}

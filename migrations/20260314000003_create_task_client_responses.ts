import type { Knex } from 'knex';

const tableName = 'task_client_responses';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(tableName, (table) => {
    table.string('id').primary();
    table.string('task_id').notNullable().index();
    table.string('client_id').notNullable().index();
    table.string('required_item', 500).notNullable();
    table.string('file_url', 1000).nullable();
    table.boolean('is_completed').defaultTo(false);
    table.text('comment').nullable();
    table.timestamps(true, true);
    table.timestamp('deleted_at').nullable();

    // Composite index for client-specific response queries
    table.index(['task_id', 'client_id'], 'idx_tcr_task_client');
    // Index for progress tracking
    table.index('is_completed', 'idx_tcr_is_completed');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists(tableName);
}

import type { Knex } from 'knex';

const tableName = 'nativeforms_submissions';

/**
 * NativeForms Integration — create nativeforms_submissions table.
 * submission_id is unique for idempotency.
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(tableName, (table) => {
    table.string('id').primary();
    table.string('organization_id').notNullable().index();
    table.string('form_link_id').nullable().index();
    table.string('submission_id', 255).notNullable().unique();
    table.string('project_id').nullable().index();
    table.string('task_id').nullable();
    table.string('client_id').nullable();
    table.string('form_url', 2048).nullable();
    table.string('display_name', 255).nullable();
    table.json('submitted_data').notNullable();
    table.json('raw_payload').notNullable();
    table.string('submitted_at').notNullable();
    table.string('created_at').notNullable();
    table.string('updated_at').notNullable();
    table.string('deleted_at').nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists(tableName);
}

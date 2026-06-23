import type { Knex } from 'knex';

const tableName = 'form_links';

/**
 * NativeForms Integration — create form_links table.
 *
 * Stores external NativeForms form URLs associated with
 * project types and milestones for client-facing intake forms.
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(tableName, (table) => {
    table.string('id').primary();
    table.string('organization_id').notNullable().index();
    table.string('form_url', 2048).notNullable();
    table.string('display_name', 255).notNullable();
    table.string('project_type_id').nullable().index();
    table.string('milestone_id').nullable().index();
    table.integer('sort_order').notNullable().defaultTo(0);
    table.string('created_at').notNullable();
    table.string('updated_at').notNullable();
    table.string('deleted_at').nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists(tableName);
}

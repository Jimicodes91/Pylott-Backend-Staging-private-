import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('project_types', (table) => {
    table.string('id', 36).primary();
    table.string('workspace_id', 36).notNullable().index();
    table.string('company_id', 36).nullable().index();
    table.string('name', 255).notNullable();
    table.string('slug', 255).notNullable();
    table.boolean('is_system').defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.timestamp('deleted_at').nullable();

    // Foreign keys
    table.foreign('workspace_id').references('id').inTable('workspaces').onDelete('CASCADE');

    // Indexes
    table.index(['workspace_id', 'deleted_at']);
    table.unique(['workspace_id', 'slug', 'deleted_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('project_types');
}

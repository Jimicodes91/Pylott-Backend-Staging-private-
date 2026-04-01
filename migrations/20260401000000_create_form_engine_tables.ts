import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('form_templates', (table) => {
    table.string('id').primary();
    table.string('company_id').notNullable();
    table.string('name', 255).notNullable();
    table.text('description').nullable();
    table.enum('status', ['draft', 'published', 'archived']).notNullable().defaultTo('draft');
    table.string('created_by').notNullable();
    table.timestamps(true, true);
    table.timestamp('deleted_at').nullable();
    table.index(['company_id'], 'idx_form_templates_company_id');
  });

  await knex.schema.createTable('form_versions', (table) => {
    table.string('id').primary();
    table.string('template_id').notNullable().references('id').inTable('form_templates');
    table.integer('version_number').notNullable();
    table.json('fields_snapshot').notNullable();
    table.string('created_by').notNullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.unique(['template_id', 'version_number']);
    table.index(['template_id'], 'idx_form_versions_template_id');
  });

  await knex.schema.createTable('form_fields', (table) => {
    table.string('id').primary();
    table.string('template_id').notNullable().references('id').inTable('form_templates');
    table.enum('type', ['text', 'textarea', 'dropdown', 'checkboxes', 'radio', 'file_upload', 'date', 'number']).notNullable();
    table.string('label', 255).notNullable();
    table.string('placeholder', 255).nullable();
    table.text('help_text').nullable();
    table.integer('sort_order').notNullable().defaultTo(0);
    table.json('validation_rules').nullable();
    table.json('conditional_rule').nullable();
    table.string('pre_fill_source', 50).nullable();
    table.json('options').nullable();
    table.json('file_config').nullable();
    table.timestamps(true, true);
    table.index(['template_id'], 'idx_form_fields_template_id');
  });

  await knex.schema.createTable('form_submissions', (table) => {
    table.string('id').primary();
    table.string('template_id').notNullable().references('id').inTable('form_templates');
    table.integer('version_number').notNullable();
    table.string('task_id').notNullable();
    table.string('client_id').notNullable();
    table.string('project_id').notNullable();
    table.string('company_id').notNullable();
    table.json('submission_data').notNullable();
    table.enum('status', ['draft', 'submitted']).notNullable().defaultTo('draft');
    table.timestamp('submitted_at').nullable();
    table.timestamps(true, true);
    table.unique(['task_id', 'client_id']);
    table.index(['task_id'], 'idx_form_submissions_task_id');
    table.index(['template_id'], 'idx_form_submissions_template_id');
    table.index(['client_id'], 'idx_form_submissions_client_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('form_submissions');
  await knex.schema.dropTableIfExists('form_fields');
  await knex.schema.dropTableIfExists('form_versions');
  await knex.schema.dropTableIfExists('form_templates');
}

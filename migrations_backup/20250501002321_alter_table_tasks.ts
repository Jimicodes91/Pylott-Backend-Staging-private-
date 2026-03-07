import type { Knex } from "knex";

const tableName = "project_tasks"

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable(tableName, (table) => {
    table.dropColumn('assignee_id');
    table.string('project_type_id').notNullable().index().after("company_id");
    table.string('task_type_id').notNullable().index().after("project_type_id");
  });
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable(tableName, table => {
    table.string('assignee_id').nullable().index();
  })
}


import type { Knex } from "knex";

const tableName = "projects";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(tableName, (table) => {
    table.string('id').primary();
    table.string('client_id').nullable().index();
    table.string('company_id').notNullable().index();
    table.string('consultant_id').nullable().index();
    table.string('milestone_id').index();
    table.string('project_type_id').index();
    table.string("name");
    table.string("status");
    table.json('custom_fields').nullable();
    table.timestamp("start_date").nullable();
    table.timestamp("end_date").nullable();
    table.timestamp("completed_at").nullable();
    table.timestamps(true, true);
    table.timestamp('deleted_at').nullable();
  });
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable(tableName);
}


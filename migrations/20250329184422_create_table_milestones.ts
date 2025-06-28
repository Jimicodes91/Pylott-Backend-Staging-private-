import type { Knex } from "knex";

const tableName = "milestones";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(tableName, (table) => {
    table.string('id').primary();
    table.string('project_type_id').notNullable().index();
    table.string('company_id').notNullable().index();
    table.string('name');
    table.boolean('is_system').nullable().defaultTo(false);
    table.integer("duration")
    table.timestamp("completed_at")
    table.timestamps(true, true);
    table.timestamp('deleted_at').nullable();
  });
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable(tableName);
}


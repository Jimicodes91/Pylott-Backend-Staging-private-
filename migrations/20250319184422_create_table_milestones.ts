import type { Knex } from "knex";

const tableName = "milestones";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTableIfNotExists(tableName, (table) => {
    table.string('id').unique().notNullable();
    table.string('project_type_id').notNullable().index();
    table.string('company_id').notNullable().index();
    table.string('name');
    table.boolean('is_system').nullable().defaultTo(false);
    table.timestamp("start_date")
    table.timestamp("end_date")
    table.timestamp("completed_at")
    table.timestamps(true, true);
    table.timestamp('deleted_at').nullable();
  });
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists(tableName);
}


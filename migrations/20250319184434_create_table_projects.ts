import type { Knex } from "knex";

const tableName = "projects";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTableIfNotExists(tableName, (table) => {
    table.string('id').unique().notNullable();
    table.string('client_id').notNullable().index();
    table.string('company_id').notNullable().index();
    table.string('consultant_id').nullable().index();
    table.string('milestone_id').index();
    table.string('stage_id').index();
    table.string('project_type_id').index();
    table.string("name");
    table.string("status");
    table.string("description").nullable()
    table.timestamp("start_date").nullable();
    table.timestamp("end_date").nullable();
    table.timestamp("completed_at").nullable();
    table.timestamps(true, true);
    table.timestamp('deleted_at').nullable();
  });
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists(tableName);
}


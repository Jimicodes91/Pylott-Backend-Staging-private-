import type { Knex } from "knex";

const tableName = "metadata";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTableIfNotExists(tableName, (table) => {
    table.string('id').unique().notNullable();
    table.string('company_id').notNullable().index();
    table.string('project_id').nullable().index();
    table.string('type').notNullable().index();
    table.string('name');
    table.string('description');
    table.timestamps(true, true);
    table.timestamp('deleted_at').nullable();
  });
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists(tableName);
}


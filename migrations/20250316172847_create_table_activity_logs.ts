import type { Knex } from "knex";

const tableName = "activity_logs"

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTableIfNotExists(tableName, (table) => {
    table.string('id').unique().notNullable();
    table.string('company_id').notNullable().index();
    table.string('user_id').notNullable().index();
    table.string('name');
    table.string('entity');
    table.string('description');
    table.timestamps(true, true);
    table.timestamp('deleted_at').nullable();
  });
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists(tableName);
}


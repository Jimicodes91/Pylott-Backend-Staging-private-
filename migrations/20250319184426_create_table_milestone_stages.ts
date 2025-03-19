import type { Knex } from "knex";

const tableName = "milestone_stages";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTableIfNotExists(tableName, (table) => {
    table.string('id').unique().notNullable();
    table.string('milestone_id').notNullable().index();
    table.string('company_id').notNullable().index();
    table.string('name');
    table.boolean('is_system').nullable().defaultTo(false);
    table.timestamps(true, true);
    table.timestamp('deleted_at').nullable();
  });
}


export async function down(knex: Knex): Promise<void> {
}


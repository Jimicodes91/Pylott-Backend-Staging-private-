import type { Knex } from "knex";

const tableName = "events"

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable(tableName, table => {
    table.string('event_type_id').nullable().alter()
  })
}


export async function down(knex: Knex): Promise<void> {
}


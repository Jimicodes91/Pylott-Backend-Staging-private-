import type { Knex } from "knex";

const tableName = "project_members"

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable(tableName, table => {
    table.string("member_type").nullable().after("user_id")
  })
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable(tableName, table => {
    table.dropColumn("member_type")
  })
}


import type { Knex } from "knex";

const tableName = "companies";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable(tableName, (table) => {
    // Add the admin_id column as a foreign key
    table.string("admin_id", 36).nullable().references("id").inTable("users");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable(tableName, (table) => {
    // Remove the foreign key constraint and the admin_id column
    table.dropForeign("admin_id");
    table.dropColumn("admin_id");
  });
}
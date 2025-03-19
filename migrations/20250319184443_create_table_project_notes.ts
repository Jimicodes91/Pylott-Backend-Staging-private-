import type { Knex } from "knex";

const tableName = "project_notes";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTableIfNotExists(tableName, (table) => {
    table.string('id').unique().notNullable();
    table.string('project_id').notNullable().index();
    table.string('author_id').notNullable().index();
    table.string('name');
    table.string('description');
    table.boolean("is_pinned").defaultTo(false);
    table.timestamps(true, true);
    table.timestamp('deleted_at').nullable();
  });
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists(tableName);
}


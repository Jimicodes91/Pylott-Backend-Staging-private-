import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.schema.alterTable('contacts', (table) => {
        table.string('organization').nullable().alter();
        table.timestamp('deleted_at').nullable().alter();
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.alterTable('contacts', (table) => {
        table.string('organization').notNullable().alter();
        table.timestamp('deleted_at').defaultTo(knex.fn.now()).alter();
    });
}
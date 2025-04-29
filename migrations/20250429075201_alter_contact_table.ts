import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.alterTable('contacts', (table) =>{
        table.string('no_of_projects').nullable();
        table.string('closed_projects').nullable();
        table.string('assigne').nullable();

    })
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.alterTable('contacts', (table)=>{
        table.dropColumn('no_of_projects');
        table.dropColumn('closed_projects');
        table.dropColumn('assigne');
    })
}


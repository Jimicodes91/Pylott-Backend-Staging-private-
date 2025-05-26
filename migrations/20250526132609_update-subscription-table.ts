import { Knex } from 'knex';


export async function up(knex: Knex): Promise<void> {
    await knex.schema.alterTable('companies', (table) => {
        table.uuid('subscription_id').nullable();
     
    });


}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.alterTable('companies', (table) => {
        table.dropColumn('subscription_id');
    });
}
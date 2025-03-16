import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Change the column type to `date`
  await knex.schema.alterTable('companies', (table) => {
    table.date('subscription_expiry_date').alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  // Revert the column type back to `string`
  await knex.schema.alterTable('companies', (table) => {
    table.string('subscription_expiry_date').alter();
  });
}
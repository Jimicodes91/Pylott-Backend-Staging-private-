import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('org_finance', (table) => {
    table.boolean('has_paid').defaultTo(false);
    table.string('payment_proof_url').nullable();
    table.timestamp('payment_date').nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('org_finance', (table) => {
    table.dropColumn('has_paid');
    table.dropColumn('payment_proof_url');
    table.dropColumn('payment_date');
  });
}
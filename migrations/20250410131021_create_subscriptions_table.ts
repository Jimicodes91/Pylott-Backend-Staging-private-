import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('subscriptions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('(UUID())'));
    table.uuid('company_id').references('id').inTable('companies');
    table.string('plan').notNullable();
    table.string('status').notNullable();
    table.dateTime('current_period_start').notNullable();
    table.dateTime('current_period_end').notNullable();
    table.boolean('cancel_at_period_end').defaultTo(false);
    table.string('payment_method_id').nullable();
    table.string('latest_invoice_id').nullable();
    table.timestamps(true, true);
    table.dateTime('deleted_at').nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('subscriptions');
}
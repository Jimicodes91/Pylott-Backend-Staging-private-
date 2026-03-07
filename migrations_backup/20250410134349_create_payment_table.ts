// migrations/[timestamp]_create_payments_table.ts
import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('payments', (table) => {
    // Primary Key
    table.uuid('id').primary();
    
    // Basic Columns (without foreign keys)
    table.uuid('company_id').notNullable();
    table.uuid('subscription_id').nullable();
    
    // Payment Details
    table.decimal('amount', 12, 2).notNullable();
    table.string('currency', 3).notNullable().defaultTo('USD');
    table.enum('payment_method', ['card', 'paypal', 'paystack']).notNullable();
    table.json('payment_method_details').notNullable();
    
    // Status Information
    table.string('status').notNullable().defaultTo('pending');
    
    table.string('invoice_id').notNullable();
    table.string('failure_reason').nullable();
    table.integer('retry_count').notNullable().defaultTo(0);

    // Timestamps
    table.timestamps(true, true);
    table.dateTime('deleted_at').nullable();

    table.foreign('subscription_id').references('id').inTable('subscriptions').onDelete('CASCADE');
    table.foreign('company_id').references('id').inTable('companies').onDelete('CASCADE');

    table.index(['company_id']);
    table.index(['status']);
    table.index(['subscription_id']);
  });

  // Add basic indexes
 

  //basic constraints
  
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('payments');
}
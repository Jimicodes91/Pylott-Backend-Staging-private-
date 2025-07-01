import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('org_finance_payments', (table) => {
    // Primary Key
    table.uuid('id').primary();
    
    // Foreign Key to org_finance
    table.string('org_finance_id').notNullable();
    
    // Payment Details
    table.decimal('amount_paid', 12, 2).notNullable();
    table.string('payment_proof_url').nullable();
    table.timestamp('payment_date').notNullable().defaultTo(knex.fn.now());
    
    // Additional metadata
    table.text('notes').nullable();
    table.string('payment_method').nullable(); // e.g., 'bank_transfer', 'check', 'cash'
    
    // Timestamps
    table.timestamps(true, true);
    table.dateTime('deleted_at').nullable();

    // Foreign key constraint
    table.foreign('org_finance_id').references('id').inTable('org_finance').onDelete('CASCADE');

    // Indexes
    table.index(['org_finance_id']);
    table.index(['payment_date']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('org_finance_payments');
}


import type { Knex } from 'knex';

const tableName = 'org_finance';

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable(tableName, (table) => {
        table.uuid('id').primary();
        table.string('client_name').notNullable();
        table.string('project_title').notNullable();
        table.string('total_project_cost').notNullable();
        table.string('amount_paid').notNullable();
        table.string('outstanding_balance').nullable();
        table.date('next_payment_due_date').nullable();
        table.string('payment_status').nullable();
        table.string('organization_id').notNullable().index();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now()); // Added updated_at
        table.timestamp('deleted_at').nullable();
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable(tableName);
}

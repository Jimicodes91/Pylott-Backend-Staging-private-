import type { Knex } from 'knex';

const tableName = 'user_companies';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(tableName, (table) => {
    table.string('id', 36).primary().notNullable();
    table.string('user_id', 36).notNullable().index();
    table.string('company_id', 36).notNullable().index();
    table.string('role', 255).notNullable(); // ADMIN, CLIENT, CONSULTANT, USER
    table.boolean('is_active').defaultTo(true);
    table.string('invited_by', 36).nullable(); // Who invited this user to the company
    table.timestamp('joined_at').defaultTo(knex.fn.now());
    table.timestamps(true, true);
    table.timestamp('deleted_at').nullable();
    
    // Add foreign key constraints
    table.foreign('user_id').references('id').inTable('users');
    table.foreign('company_id').references('id').inTable('companies');
    table.foreign('invited_by').references('id').inTable('users');
    
    // Ensure a user can only be in a company once
    table.unique(['user_id', 'company_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable(tableName);
} 
import type { Knex } from 'knex';

const tableName = 'users';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(tableName, (table) => {
    table.string('id', 36).primary().notNullable();
    table.string('email', 255).unique().index(); 
    table.string('pfp', 255).nullable(); 
    table.string('password', 255).notNullable(); 
    table.string('name', 255).nullable(); 
    table.enum('role', ['super_admin', 'admin', 'consultant', 'client']).defaultTo('client'); 
    table.string('company_id', 36).nullable();
    table.boolean('is_blocked').defaultTo(false); 
    table.boolean('is_verified').defaultTo(false); 
    table.string('timezone', 255).nullable(); 
    table.string('language', 255).defaultTo('en'); 
    table.string('currency', 255).defaultTo('USD'); 
    table.boolean('is_active').defaultTo(true); 
    table.timestamp('last_login').nullable(); 
    table.string('verification_token', 255).nullable(); 
    table.bigInteger('token_expires').nullable(); 
    table.string('password_setup_token', 255).nullable(); 
    table.bigInteger('password_setup_token_expires').nullable(); 
    table.timestamps(true, true); 
    table.timestamp('deleted_at').nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists(tableName);
}

import type { Knex } from 'knex';

const tableName = 'invitations';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(tableName, (table) => {
    table.string('id', 36).primary().notNullable();
    table.string('email', 255).notNullable().index();
    table.string('role', 50).notNullable(); // ADMIN, CLIENT, CONSULTANT, USER
    table.string('company_id', 36).notNullable().index();
    table.string('invited_by', 36).notNullable();
    table.string('invitation_token', 255).notNullable().unique();
    table.bigInteger('token_expires').notNullable();
    table.enum('status', ['PENDING', 'ACCEPTED', 'EXPIRED']).defaultTo('PENDING');
    table.timestamps(true, true);
    table.timestamp('deleted_at').nullable();
    
    // Add foreign key constraints
    table.foreign('company_id').references('id').inTable('companies');
    table.foreign('invited_by').references('id').inTable('users');
    
   
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists(tableName);
}

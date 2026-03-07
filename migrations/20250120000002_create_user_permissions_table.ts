import type { Knex } from 'knex';

const tableName = 'user_permissions';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(tableName, (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('(UUID())'));
    table.uuid('user_id').notNullable();
    table.enum('permission_key', [
      'invite_admin',
      'invite_consultant',
      'invite_client',
      'approve_client_invites',
      'manage_journeys',
      'deactivate_users',
      'manage_projects',
      'view_all_projects',
      'manage_finances'
    ]).notNullable();
    table.timestamp('granted_at').defaultTo(knex.fn.now());
    table.uuid('granted_by').notNullable();
    
    // Foreign keys
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('granted_by').references('id').inTable('users').onDelete('CASCADE');
    
    // Unique constraint on user_id + permission_key
    table.unique(['user_id', 'permission_key']);
    
    // Index for performance
    table.index('user_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists(tableName);
}

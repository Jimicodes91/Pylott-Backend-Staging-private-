import type { Knex } from 'knex';

const tableName = 'audit_logs';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(tableName, (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('(UUID())'));
    table.uuid('workspace_id').notNullable();
    table.uuid('user_id').notNullable();
    table.enum('action', [
      'user_deactivated',
      'user_reactivated',
      'permission_granted',
      'permission_revoked',
      'contact_status_changed',
      'project_created',
      'project_updated',
      'task_assigned',
      'task_completed',
      'invite_sent',
      'invite_approved',
      'invite_rejected'
    ]).notNullable();
    table.enum('entity_type', ['user', 'contact', 'project', 'task', 'permission', 'invite']).notNullable();
    table.uuid('entity_id').notNullable();
    table.json('details').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    // Foreign keys
    table.foreign('workspace_id').references('id').inTable('workspaces').onDelete('CASCADE');
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    
    // Indexes for performance
    table.index('workspace_id');
    table.index('user_id');
    table.index('entity_type');
    table.index('entity_id');
    table.index('created_at');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists(tableName);
}

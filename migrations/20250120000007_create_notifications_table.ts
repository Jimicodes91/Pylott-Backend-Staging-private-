import type { Knex } from 'knex';

const tableName = 'notifications';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(tableName, (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('(UUID())'));
    table.uuid('user_id').notNullable();
    table.enum('type', [
      'task_assigned',
      'task_completed',
      'project_updated',
      'invite_received',
      'invite_approved',
      'invite_approval_required'
    ]).notNullable();
    table.string('title', 255).notNullable();
    table.text('message').notNullable();
    table.string('link', 500).nullable();
    table.timestamp('read_at').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    // Foreign key
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    
    // Indexes for performance
    table.index('user_id');
    table.index(['user_id', 'read_at']); // Composite index for unread queries
    table.index('created_at');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists(tableName);
}

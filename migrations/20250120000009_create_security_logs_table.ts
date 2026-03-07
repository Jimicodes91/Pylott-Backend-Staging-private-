import type { Knex } from 'knex';

const tableName = 'security_logs';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(tableName, (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('(UUID())'));
    table.enum('event_type', [
      'login_attempt',
      'login_success',
      'login_failure',
      'rate_limit_exceeded',
      'ip_blocked',
      'token_expired',
      'invalid_token',
      'unauthorized_access'
    ]).notNullable();
    table.uuid('user_id').nullable();
    table.string('ip_address', 45).notNullable(); // IPv6 max length
    table.text('user_agent').nullable();
    table.json('details').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    // Foreign key (nullable because some events may not have a user)
    table.foreign('user_id').references('id').inTable('users').onDelete('SET NULL');
    
    // Indexes for performance
    table.index('user_id');
    table.index('ip_address');
    table.index('event_type');
    table.index('created_at');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists(tableName);
}

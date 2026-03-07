import type { Knex } from 'knex';

const tableName = 'users';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable(tableName, (table) => {
    // Add workspace_id field
    table.uuid('workspace_id').nullable().after('company_id');
    
    // Add foreign key constraint
    table.foreign('workspace_id').references('id').inTable('workspaces').onDelete('CASCADE');
    
    // Add status field
    table.enum('status', ['active', 'deactivated', 'invited']).defaultTo('active').after('role');
    
    // Add is_primary_admin field
    table.boolean('is_primary_admin').defaultTo(false).after('status');
    
    // Add deactivation tracking fields
    table.timestamp('deactivated_at').nullable().after('is_primary_admin');
    table.uuid('deactivated_by').nullable().after('deactivated_at');
    
    // Add index on workspace_id for performance
    table.index('workspace_id');
    table.index('role');
    table.index('status');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable(tableName, (table) => {
    table.dropForeign(['workspace_id']);
    table.dropIndex(['workspace_id']);
    table.dropIndex(['role']);
    table.dropIndex(['status']);
    table.dropColumn('workspace_id');
    table.dropColumn('status');
    table.dropColumn('is_primary_admin');
    table.dropColumn('deactivated_at');
    table.dropColumn('deactivated_by');
  });
}

import type { Knex } from 'knex';

const tableName = 'contacts';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable(tableName, (table) => {
    // Add workspace_id field
    table.uuid('workspace_id').nullable().after('id');
    
    // Add foreign key constraint
    table.foreign('workspace_id').references('id').inTable('workspaces').onDelete('CASCADE');
    
    // Add status field
    table.enum('status', ['uninvited', 'invited', 'active']).defaultTo('uninvited').after('address');
    
    // Add user_id field (nullable, set when contact becomes active)
    table.uuid('user_id').nullable().after('status');
    
    // Add foreign key for user_id
    table.foreign('user_id').references('id').inTable('users').onDelete('SET NULL');
    
    // Add invited tracking fields
    table.timestamp('invited_at').nullable().after('user_id');
    table.uuid('invited_by').nullable().after('invited_at');
    
    // Add foreign key for invited_by
    table.foreign('invited_by').references('id').inTable('users').onDelete('SET NULL');
    
    // Add closed_projects counter
    table.integer('closed_projects').defaultTo(0).after('total_projects');
    
    // Add indexes for performance
    table.index('workspace_id');
    table.index('status');
    table.index('user_id');
  });
  
  // Alter active_projects and total_projects to integer type (currently string)
  await knex.raw(`
    ALTER TABLE ${tableName} 
    MODIFY COLUMN active_projects INT DEFAULT 0,
    MODIFY COLUMN total_projects INT DEFAULT 0
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable(tableName, (table) => {
    table.dropForeign(['workspace_id']);
    table.dropForeign(['user_id']);
    table.dropForeign(['invited_by']);
    table.dropIndex(['workspace_id']);
    table.dropIndex(['status']);
    table.dropIndex(['user_id']);
    table.dropColumn('workspace_id');
    table.dropColumn('status');
    table.dropColumn('user_id');
    table.dropColumn('invited_at');
    table.dropColumn('invited_by');
    table.dropColumn('closed_projects');
  });
  
  // Revert active_projects and total_projects back to string
  await knex.raw(`
    ALTER TABLE ${tableName} 
    MODIFY COLUMN active_projects VARCHAR(255),
    MODIFY COLUMN total_projects VARCHAR(255)
  `);
}

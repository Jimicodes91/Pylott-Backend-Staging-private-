import type { Knex } from 'knex';

const tableName = 'project_tasks';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable(tableName, (table) => {
    // Add visibility field
    table.enum('visibility', ['inhouse', 'client_facing']).defaultTo('inhouse').after('status');
    
    // Add document_url field
    table.string('document_url', 500).nullable().after('visibility');
    
    // Add task_type_id field (if not exists)
    table.uuid('task_type_id').nullable().after('company_id');
    
    // Add index on visibility for filtering
    table.index('visibility');
  });
  
  // Rename end_date to due_date
  await knex.raw(`
    ALTER TABLE ${tableName} 
    CHANGE COLUMN end_date due_date TIMESTAMP NULL
  `);
  
  // Drop start_date column
  await knex.schema.alterTable(tableName, (table) => {
    table.dropColumn('start_date');
  });
  
  // Make description nullable
  await knex.raw(`
    ALTER TABLE ${tableName} 
    MODIFY COLUMN description TEXT NULL
  `);
  
  // Update status enum to only include 'pending' and 'completed'
  // Note: This requires careful handling of existing data
  await knex.raw(`
    ALTER TABLE ${tableName} 
    MODIFY COLUMN status ENUM('pending', 'completed') DEFAULT 'pending'
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable(tableName, (table) => {
    table.dropIndex(['visibility']);
    table.dropColumn('visibility');
    table.dropColumn('document_url');
    table.dropColumn('task_type_id');
  });
  
  // Rename due_date back to end_date
  await knex.raw(`
    ALTER TABLE ${tableName} 
    CHANGE COLUMN due_date end_date TIMESTAMP NULL
  `);
  
  // Add back start_date column
  await knex.schema.alterTable(tableName, (table) => {
    table.timestamp('start_date').nullable().after('status');
  });
  
  // Make description not nullable
  await knex.raw(`
    ALTER TABLE ${tableName} 
    MODIFY COLUMN description VARCHAR(255) NOT NULL
  `);
  
  // Revert status enum
  await knex.raw(`
    ALTER TABLE ${tableName} 
    MODIFY COLUMN status VARCHAR(255)
  `);
}

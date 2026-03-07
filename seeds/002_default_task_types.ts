import type { Knex } from 'knex';
import { v4 as uuidv4 } from 'uuid';

export async function seed(knex: Knex): Promise<void> {
  // Note: This seed file is designed to be run after workspace creation
  // In production, task types should be created per workspace during signup
  // This seed is for development/testing purposes only
  
  const tableName = 'task_types';
  
  // Check if task_types table exists
  const tableExists = await knex.schema.hasTable(tableName);
  
  if (!tableExists) {
    console.log(`Table ${tableName} does not exist. Creating it...`);
    
    // Create task_types table if it doesn't exist
    await knex.schema.createTable(tableName, (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('(UUID())'));
      table.uuid('workspace_id').notNullable();
      table.string('name', 255).notNullable();
      table.text('description').nullable();
      table.boolean('has_upload_field').defaultTo(false);
      table.timestamps(true, true);
      
      // Foreign key
      table.foreign('workspace_id').references('id').inTable('workspaces').onDelete('CASCADE');
      
      // Index
      table.index('workspace_id');
    });
    
    console.log('Created task_types table');
  }
  
  // Get all workspaces
  const workspaces = await knex('workspaces').select('id');
  
  if (workspaces.length === 0) {
    console.log('No workspaces found. Skipping task type seed.');
    return;
  }
  
  // Default task types to seed
  const defaultTaskTypes = [
    { 
      name: 'Document Upload', 
      description: 'Upload required documents',
      has_upload_field: true 
    },
    { 
      name: 'Review', 
      description: 'Review submitted documents or information',
      has_upload_field: false 
    },
    { 
      name: 'Approval', 
      description: 'Approve or reject submitted items',
      has_upload_field: false 
    },
    { 
      name: 'Meeting', 
      description: 'Schedule and conduct meetings',
      has_upload_field: false 
    },
    { 
      name: 'Follow-up', 
      description: 'Follow up on pending items',
      has_upload_field: false 
    }
  ];
  
  // Seed task types for each workspace
  for (const workspace of workspaces) {
    for (const taskType of defaultTaskTypes) {
      // Check if task type already exists for this workspace
      const existing = await knex(tableName)
        .where({ name: taskType.name, workspace_id: workspace.id })
        .first();
      
      if (!existing) {
        await knex(tableName).insert({
          id: uuidv4(),
          name: taskType.name,
          description: taskType.description,
          has_upload_field: taskType.has_upload_field,
          workspace_id: workspace.id,
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        });
        console.log(`Seeded task type: ${taskType.name} for workspace ${workspace.id}`);
      }
    }
  }
}

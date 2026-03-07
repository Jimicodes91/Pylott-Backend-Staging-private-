import type { Knex } from 'knex';
import { v4 as uuidv4 } from 'uuid';

export async function seed(knex: Knex): Promise<void> {
  // Note: This seed file is designed to be run after workspace creation
  // In production, journeys should be created per workspace during signup
  // This seed is for development/testing purposes only
  
  const tableName = 'project_types';
  
  // Check if project_types table exists
  const tableExists = await knex.schema.hasTable(tableName);
  
  if (!tableExists) {
    console.log(`Table ${tableName} does not exist. Skipping seed.`);
    return;
  }
  
  // Get all workspaces
  const workspaces = await knex('workspaces').select('id');
  
  if (workspaces.length === 0) {
    console.log('No workspaces found. Skipping journey seed.');
    return;
  }
  
  // Default journeys to seed
  const defaultJourneys = [
    { name: 'Business Setup', description: 'Complete business setup and registration process' },
    { name: 'Relocation', description: 'International relocation and immigration services' },
    { name: 'Compliance', description: 'Regulatory compliance and legal requirements' }
  ];
  
  // Seed journeys for each workspace
  for (const workspace of workspaces) {
    for (const journey of defaultJourneys) {
      // Check if journey already exists for this workspace
      const existing = await knex(tableName)
        .where({ name: journey.name, workspace_id: workspace.id })
        .first();
      
      if (!existing) {
        await knex(tableName).insert({
          id: uuidv4(),
          name: journey.name,
          description: journey.description,
          workspace_id: workspace.id,
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        });
        console.log(`Seeded journey: ${journey.name} for workspace ${workspace.id}`);
      }
    }
  }
}

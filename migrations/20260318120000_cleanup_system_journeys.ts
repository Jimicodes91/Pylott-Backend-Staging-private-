import type { Knex } from 'knex';

/**
 * Data cleanup: Remove auto-seeded system journeys (is_system = true) and their milestones.
 * Only deletes system journeys that have NO active projects assigned to them.
 * Safe to run multiple times (idempotent).
 */
export async function up(knex: Knex): Promise<void> {
  // Find system project_types that have NO active projects (deleted_at IS NULL)
  const systemTypesWithProjects = await knex('projects')
    .select('project_type_id')
    .whereNull('deleted_at')
    .whereIn('project_type_id', knex('project_types').select('id').where('is_system', true));

  const inUseIds = systemTypesWithProjects.map((r: { project_type_id: string }) => r.project_type_id);

  // Build query for system types NOT in use
  const deletableQuery = knex('project_types').where('is_system', true);
  if (inUseIds.length > 0) {
    deletableQuery.whereNotIn('id', inUseIds);
  }
  const deletableTypes = await deletableQuery.select('id');
  const deletableIds = deletableTypes.map((r: { id: string }) => r.id);

  if (deletableIds.length === 0) {
    console.log('[CLEANUP] No system journeys to delete (either none exist or all are in use).');
    return;
  }

  // Delete milestones belonging to those project types
  const milestonesDeleted = await knex('milestones').whereIn('project_type_id', deletableIds).del();
  console.log(`[CLEANUP] Deleted ${milestonesDeleted} milestones from ${deletableIds.length} system journey(s).`);

  // Delete the project types themselves
  const typesDeleted = await knex('project_types').whereIn('id', deletableIds).del();
  console.log(`[CLEANUP] Deleted ${typesDeleted} system journey(s).`);

  if (inUseIds.length > 0) {
    console.log(`[CLEANUP] Skipped ${inUseIds.length} system journey(s) that have active projects.`);
  }
}

export async function down(_knex: Knex): Promise<void> {
  // Data cleanup is not reversible — the seeded data was incorrect and should not be restored.
  console.log('[CLEANUP] Down migration is a no-op. System journeys will not be re-created.');
}

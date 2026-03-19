import type { Knex } from 'knex';

/**
 * Data cleanup: Remove ALL remaining legacy/test journeys and their associated data.
 * Covers non-system journeys that weren't caught by the previous is_system cleanup.
 * Deletes: task_assignees → project_tasks → project_members → projects → milestones → project_types
 */
export async function up(knex: Knex): Promise<void> {
  // Get all remaining project_types
  const journeys = await knex('project_types').whereNull('deleted_at').select('id', 'name', 'company_id');

  if (journeys.length === 0) {
    console.log('[CLEANUP] No journeys to delete.');
    return;
  }

  console.log(`[CLEANUP] Cleaning ${journeys.length} journey(s)...`);

  for (const journey of journeys) {
    const pRows = await knex('projects').where('project_type_id', journey.id).select('id');
    const pIds = pRows.map((p: { id: string }) => p.id);

    if (pIds.length > 0) {
      const tRows = await knex('project_tasks').whereIn('project_id', pIds).select('id');
      const tIds = tRows.map((t: { id: string }) => t.id);

      if (tIds.length > 0) {
        await knex('task_assignees').whereIn('task_id', tIds).del();
        await knex('project_tasks').whereIn('id', tIds).del();
      }

      await knex('project_members').whereIn('project_id', pIds).del();
      await knex('projects').whereIn('id', pIds).del();
    }

    await knex('milestones').where('project_type_id', journey.id).del();
    await knex('project_types').where('id', journey.id).del();
    console.log(`[CLEANUP] Deleted "${journey.name}" (company: ${journey.company_id})`);
  }
}

export async function down(_knex: Knex): Promise<void> {
  console.log('[CLEANUP] Down migration is a no-op.');
}

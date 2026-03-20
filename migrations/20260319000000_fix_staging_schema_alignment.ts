import type { Knex } from 'knex';

/**
 * Fix staging DB schema alignment.
 * 
 * The staging DB was built from a mix of old (workspace-era) and new (company-era)
 * migrations, leaving several tables with missing columns or using workspace_id
 * where the code expects company_id.
 * 
 * This migration is idempotent — it checks for column existence before altering.
 */
export async function up(knex: Knex): Promise<void> {
  // Helper: check if a column exists
  const hasCol = async (table: string, col: string) => knex.schema.hasColumn(table, col);

  // ─── contacts: add company_id, no_of_projects ───
  if (!(await hasCol('contacts', 'company_id'))) {
    await knex.schema.alterTable('contacts', (t) => {
      t.string('company_id', 36).nullable().after('id');
    });
    // Copy workspace_id → company_id for existing rows
    await knex.raw("UPDATE contacts SET company_id = workspace_id WHERE company_id IS NULL AND workspace_id IS NOT NULL");
  }
  if (!(await hasCol('contacts', 'no_of_projects'))) {
    await knex.schema.alterTable('contacts', (t) => {
      t.string('no_of_projects').nullable();
    });
  }
  if (!(await hasCol('contacts', 'assigned_to'))) {
    await knex.schema.alterTable('contacts', (t) => {
      t.json('assigned_to').nullable();
    });
  }

  // ─── projects: add milestone_start_date, milestone_status, currency, country ───
  if (!(await hasCol('projects', 'milestone_start_date'))) {
    await knex.schema.alterTable('projects', (t) => {
      t.timestamp('milestone_start_date').nullable();
    });
  }
  if (!(await hasCol('projects', 'milestone_status'))) {
    await knex.schema.alterTable('projects', (t) => {
      t.string('milestone_status').nullable();
    });
  }
  if (!(await hasCol('projects', 'currency'))) {
    await knex.schema.alterTable('projects', (t) => {
      t.string('currency').nullable();
    });
  }
  if (!(await hasCol('projects', 'country'))) {
    await knex.schema.alterTable('projects', (t) => {
      t.string('country').nullable();
    });
  }

  // ─── audit_logs: add company_id ───
  if (!(await hasCol('audit_logs', 'company_id'))) {
    await knex.schema.alterTable('audit_logs', (t) => {
      t.string('company_id', 36).nullable().after('id');
    });
    await knex.raw("UPDATE audit_logs SET company_id = workspace_id WHERE company_id IS NULL AND workspace_id IS NOT NULL");
  }

  // ─── project_members: add member_type ───
  if (!(await hasCol('project_members', 'member_type'))) {
    await knex.schema.alterTable('project_members', (t) => {
      t.string('member_type').nullable();
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasCol = async (table: string, col: string) => knex.schema.hasColumn(table, col);

  if (await hasCol('contacts', 'company_id')) {
    await knex.schema.alterTable('contacts', (t) => t.dropColumn('company_id'));
  }
  if (await hasCol('contacts', 'no_of_projects')) {
    await knex.schema.alterTable('contacts', (t) => t.dropColumn('no_of_projects'));
  }
  if (await hasCol('contacts', 'assigned_to')) {
    await knex.schema.alterTable('contacts', (t) => t.dropColumn('assigned_to'));
  }
  if (await hasCol('projects', 'milestone_start_date')) {
    await knex.schema.alterTable('projects', (t) => t.dropColumn('milestone_start_date'));
  }
  if (await hasCol('projects', 'milestone_status')) {
    await knex.schema.alterTable('projects', (t) => t.dropColumn('milestone_status'));
  }
  if (await hasCol('projects', 'currency')) {
    await knex.schema.alterTable('projects', (t) => t.dropColumn('currency'));
  }
  if (await hasCol('projects', 'country')) {
    await knex.schema.alterTable('projects', (t) => t.dropColumn('country'));
  }
  if (await hasCol('audit_logs', 'company_id')) {
    await knex.schema.alterTable('audit_logs', (t) => t.dropColumn('company_id'));
  }
  if (await hasCol('project_members', 'member_type')) {
    await knex.schema.alterTable('project_members', (t) => t.dropColumn('member_type'));
  }
}

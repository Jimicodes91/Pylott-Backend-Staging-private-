import type { Knex } from 'knex';

/**
 * Requirement #6.3–6.4: Client invite rights and approval workflow.
 * - user_companies: can_invite_clients, can_approve_client_invites (Super Admin grants these).
 * - contacts: added_by_user_id (who added the contact; Super Admin/Admin can see contacts added by consultants).
 * - client_invite_requests: when Consultant requests client invite, admin must approve before invite is sent.
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('user_companies', (table) => {
    table.boolean('can_invite_clients').defaultTo(false).nullable();
    table.boolean('can_approve_client_invites').defaultTo(false).nullable();
  });

  await knex.schema.alterTable('contacts', (table) => {
    table.string('added_by_user_id', 36).nullable().index();
  });

  await knex.schema.createTable('client_invite_requests', (table) => {
    table.string('id', 36).primary();
    table.string('contact_id', 36).notNullable().index();
    table.string('company_id', 36).notNullable().index();
    table.string('requested_by_user_id', 36).notNullable().index();
    table.string('status', 50).notNullable().defaultTo('pending'); // pending | approved | rejected
    table.string('approved_by_user_id', 36).nullable();
    table.timestamp('approved_at').nullable();
    table.timestamps(true, true);
    table.timestamp('deleted_at').nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('client_invite_requests');
  await knex.schema.alterTable('contacts', (table) => {
    table.dropColumn('added_by_user_id');
  });
  await knex.schema.alterTable('user_companies', (table) => {
    table.dropColumn('can_invite_clients');
    table.dropColumn('can_approve_client_invites');
  });
}

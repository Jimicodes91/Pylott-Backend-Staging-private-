export * from './client.model';
export * from './consultant.model';
export * from './user.model';
export * from './company.model';
export * from './project.model';
export * from './project_task.model';
export * from './activity_log.model';
export * from './document_attachments.model';
export * from './documents.model';
export * from './metadata.model';
export * from './events.model';
export * from './project_notes.model';
export * from './milestone_stages.model';
export * from './milestones.model';
export * from './project_type.model';
export * from './project_members.model';
export * from './comments.model';
export * from './project_settings.model';
export * from './document_request.model';
export * from './payment.model';
export * from './subscription.model';

import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('companies', (table) => {
    table.string('subscription_plan').nullable();

    table.string('billing_cycle').nullable();
    table.string('default_payment_method').nullable();
    table.timestamp('grace_period_end_date').nullable();
    table.string('billing_email').nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('companies', (table) => {
    table.dropColumn('subscription_plan');

    table.dropColumn('billing_cycle');
    table.dropColumn('default_payment_method');
    table.dropColumn('grace_period_end_date');
    table.dropColumn('billing_email');
  });
}

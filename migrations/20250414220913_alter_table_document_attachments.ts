import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('attachments', (table) => {
		table.string('field_id').nullable();
		table.jsonb('context').nullable().comment('Additional metadata about the attachment');
		table.index(['field_id'], 'idx_document_attachments_field_id');
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('attachments', (table) => {
		table.dropColumn('field_id');
		table.dropColumn('context');
	});
}

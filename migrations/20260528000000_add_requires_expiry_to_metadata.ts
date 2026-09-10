import type { Knex } from 'knex';

/**
 * Client Documents & Tasks — add requires_expiry to metadata (document types).
 * When true, documents of this type require an expiry date on upload.
 */
export async function up(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn('metadata', 'requires_expiry');
  if (!hasColumn) {
    await knex.schema.alterTable('metadata', (table) => {
      table.boolean('requires_expiry').notNullable().defaultTo(false);
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn('metadata', 'requires_expiry');
  if (hasColumn) {
    await knex.schema.alterTable('metadata', (table) => {
      table.dropColumn('requires_expiry');
    });
  }
}

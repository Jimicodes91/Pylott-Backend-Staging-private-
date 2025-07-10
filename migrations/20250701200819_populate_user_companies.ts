import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Get all users with valid company_id (that exist in companies table)
  const users = await knex('users')
    .join('companies', 'users.company_id', 'companies.id')
    .whereNotNull('users.company_id')
    .whereNull('users.deleted_at')
    .whereNull('companies.deleted_at')
    .select('users.id', 'users.company_id', 'users.role');

  // Insert existing user-company relationships into user_companies table
  for (const user of users) {
    await knex('user_companies').insert({
      id: knex.raw('UUID()'),
      user_id: user.id,
      company_id: user.company_id,
      role: user.role || 'USER',
      is_active: true,
      joined_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    });
  }

  console.log(`Migrated ${users.length} user-company relationships to user_companies table`);
}

export async function down(knex: Knex): Promise<void> {
  // Remove all data from user_companies table
  await knex('user_companies').del();
} 
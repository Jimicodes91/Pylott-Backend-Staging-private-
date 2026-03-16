import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    table.string('otp', 4).nullable(); // 4-digit OTP
    table.bigInteger('otp_expires').nullable(); // OTP expiry timestamp
  
    

  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {

    table.dropColumn('otp');
    table.dropColumn('otp_expires');
  
  });
}

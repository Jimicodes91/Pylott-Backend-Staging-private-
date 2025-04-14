// migrations/XXXXXXXXXXXXXX_create_subscription_plans_table.ts
import type { Knex } from 'knex';
import { SubscriptionPlan } from '../src/shared/utils/subscription.type';
import { v4 as uuidv4 } from 'uuid';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('subscription_plans', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('(UUID())')); // MySQL-specific UUID generation
    table.enum('name', Object.values(SubscriptionPlan)).notNullable().unique();
    table.string('display_name').notNullable();
    table.decimal('price', 10, 2).notNullable();
    table.boolean('price_per_seat').defaultTo(false);
    table.string('currency', 3).defaultTo('USD');
    table.jsonb('features').notNullable();
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.index(['name', 'is_active'], 'subscription_plans_active_idx');
  });

  // Generate UUIDs for seed data
  const starterId = uuidv4();
  const advancedId = uuidv4();
  const premiumId = uuidv4();

  // Seed initial data with explicit IDs
  await knex('subscription_plans').insert([
    {
      id: starterId,
      name: SubscriptionPlan.STARTER,
      display_name: 'Starter',
      price: 250.00,
      price_per_seat: true,
      features: JSON.stringify([
        {
          id: 'basic-analytics',
          name: 'Basic Analytics',
          description: 'Access to basic analytics dashboard',
          enabled: true
        },
        {
          id: '5-seats',
          name: '5 Team Members',
          description: 'Up to 5 team members can use the platform',
          enabled: true
        }
      ])
    },
    {
      id: advancedId,
      name: SubscriptionPlan.ADVANCED,
      display_name: 'Advanced',
      price: 500.00,
      price_per_seat: true,
      features: JSON.stringify([
        {
          id: 'advanced-analytics',
          name: 'Advanced Analytics',
          description: 'Access to advanced analytics with historical data',
          enabled: true
        },
        {
          id: 'unlimited-seats',
          name: 'Unlimited Team Members',
          description: 'Add as many team members as you need',
          enabled: true
        },
        {
          id: 'priority-support',
          name: 'Priority Support',
          description: 'Get faster responses from our support team',
          enabled: true
        }
      ])
    },
    {
      id: premiumId,
      name: SubscriptionPlan.PREMIUM,
      display_name: 'Premium',
      price: 1000.00,
      price_per_seat: false,
      features: JSON.stringify([
        {
          id: 'all-features',
          name: 'All Features',
          description: 'Access to all platform features',
          enabled: true
        },
        {
          id: 'dedicated-support',
          name: 'Dedicated Support',
          description: '24/7 dedicated support line',
          enabled: true
        },
        {
          id: 'custom-branding',
          name: 'Custom Branding',
          description: 'White-label the platform with your branding',
          enabled: true
        }
      ])
    }
  ]);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('subscription_plans');
}
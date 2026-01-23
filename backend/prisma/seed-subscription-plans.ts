import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedSubscriptionPlans() {
  console.log('🌱 Seeding subscription plans...');

  const plans = [
    {
      name: 'Free Plan',
      type: 'FREE',
      price: 0,
      currency: 'INR',
      billingCycle: 'lifetime',
      features: JSON.stringify([
        '1 User',
        '100 Deals',
        '500 Contacts',
        '1GB Storage',
        'Basic Email Support',
        'Mobile App Access',
      ]),
      maxUsers: 1,
      maxDeals: 100,
      maxContacts: 500,
      maxStorage: 1048576, // 1GB in KB
      isActive: true,
    },
    {
      name: 'Basic Plan',
      type: 'BASIC',
      price: 999,
      currency: 'INR',
      billingCycle: 'monthly',
      features: JSON.stringify([
        'Up to 5 Users',
        '1,000 Deals',
        '5,000 Contacts',
        '10GB Storage',
        'Email & Chat Support',
        'Mobile App Access',
        'Basic Analytics',
        'Calendar Integration',
      ]),
      maxUsers: 5,
      maxDeals: 1000,
      maxContacts: 5000,
      maxStorage: 10485760, // 10GB in KB
      isActive: true,
    },
    {
      name: 'Pro Plan',
      type: 'PRO',
      price: 2999,
      currency: 'INR',
      billingCycle: 'monthly',
      features: JSON.stringify([
        'Up to 20 Users',
        'Unlimited Deals',
        'Unlimited Contacts',
        '100GB Storage',
        'Priority Support (24/7)',
        'Mobile App Access',
        'Advanced Analytics',
        'Calendar Integration',
        'Email Templates',
        'Workflow Automation',
        'Custom Fields',
        'API Access',
      ]),
      maxUsers: 20,
      maxDeals: 999999,
      maxContacts: 999999,
      maxStorage: 104857600, // 100GB in KB
      isActive: true,
    },
    {
      name: 'Enterprise Plan',
      type: 'ENTERPRISE',
      price: 9999,
      currency: 'INR',
      billingCycle: 'monthly',
      features: JSON.stringify([
        'Unlimited Users',
        'Unlimited Deals',
        'Unlimited Contacts',
        'Unlimited Storage',
        'Dedicated Account Manager',
        'Priority Support (24/7)',
        'Mobile App Access',
        'Advanced Analytics & Reporting',
        'Calendar Integration',
        'Email Templates',
        'Workflow Automation',
        'Custom Fields',
        'Full API Access',
        'Custom Integrations',
        'SSO/SAML Integration',
        'Advanced Security Features',
        'White Label Options',
        'Training & Onboarding',
      ]),
      maxUsers: 999999,
      maxDeals: 999999,
      maxContacts: 999999,
      maxStorage: 999999999, // Unlimited
      isActive: true,
    },
  ];

  for (const plan of plans) {
    const existingPlan = await prisma.subscriptionPlan.findUnique({
      where: { type: plan.type as any },
    });

    if (existingPlan) {
      console.log(`✓ Plan ${plan.name} already exists, updating...`);
      await prisma.subscriptionPlan.update({
        where: { type: plan.type as any },
        data: plan,
      });
    } else {
      console.log(`✓ Creating plan: ${plan.name}`);
      await prisma.subscriptionPlan.create({
        data: plan,
      });
    }
  }

  console.log('✅ Subscription plans seeded successfully!');
}

async function main() {
  try {
    await seedSubscriptionPlans();
  } catch (error) {
    console.error('❌ Error seeding subscription plans:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

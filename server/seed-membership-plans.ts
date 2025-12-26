import { db } from './db.js';
import { shopMembershipPlans } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

const DEFAULT_PLANS = [
  {
    planId: 'free',
    name: 'Free',
    description: 'Get started with basic features',
    monthlyPrice: '0.00',
    yearlyPrice: '0.00',
    downloadsLimit: '5/day, 30/month (free products only)',
    features: [
      'Access to free products only',
      '5 downloads per day',
      '30 downloads per month',
      'Basic features'
    ],
    annualAdLimit: 0,
    dailyDownloadLimit: 5,
    monthlyPaidDownloadLimit: 0, // Cannot download paid products
    adDurations: [],
    popular: false,
    active: true,
    displayOrder: 0
  },
  {
    planId: 'creator',
    name: 'Creator',
    description: 'Perfect for individual creators',
    monthlyPrice: '14.99',
    yearlyPrice: '161.88',
    downloadsLimit: 'Unlimited free, 5/day - 25/month paid',
    features: [
      'Unlimited free product downloads',
      'Paid products: 5/day, 25/month',
      'Priority support',
      '1 ad (7-day) - Annual only'
    ],
    annualAdLimit: 1,
    dailyDownloadLimit: 5,
    monthlyPaidDownloadLimit: 25,
    adDurations: [7],
    popular: false,
    active: true,
    displayOrder: 1
  },
  {
    planId: 'pro',
    name: 'Pro',
    description: 'For professionals and small teams',
    monthlyPrice: '24.99',
    yearlyPrice: '188.88',
    downloadsLimit: 'Unlimited free, 10/day - 50/month paid',
    features: [
      'Unlimited free product downloads',
      'Paid products: 10/day, 50/month',
      'Advanced analytics',
      'Custom branding',
      '3 ads (1× 7-day, 2× 14-day) - Annual only'
    ],
    annualAdLimit: 3,
    dailyDownloadLimit: 10,
    monthlyPaidDownloadLimit: 50,
    adDurations: [7, 14, 14],
    popular: true,
    active: true,
    displayOrder: 2
  },
  {
    planId: 'business',
    name: 'Business',
    description: 'For growing businesses and agencies',
    monthlyPrice: '89.99',
    yearlyPrice: '604.68',
    downloadsLimit: 'Unlimited downloads',
    features: [
      'Unlimited downloads (free & paid)',
      'Team collaboration',
      'API access',
      '12 ads (any duration) - Annual only',
      'Dedicated account manager'
    ],
    annualAdLimit: 12,
    dailyDownloadLimit: null, // Unlimited
    monthlyPaidDownloadLimit: null, // Unlimited
    adDurations: [7, 14, 30],
    popular: false,
    active: true,
    displayOrder: 3
  }
];

export async function seedMembershipPlans() {
  try {
    console.log('💎 Seeding membership plans...');
    
    // Check if plans already exist
    const existingPlans = await db.select().from(shopMembershipPlans);
    
    if (existingPlans.length > 0) {
      console.log(`ℹ️ Membership plans already seeded (${existingPlans.length} plans found)`);
      return;
    }

    // Insert default plans
    await db.insert(shopMembershipPlans).values(DEFAULT_PLANS);

    const finalCount = await db.select().from(shopMembershipPlans);
    console.log(`✅ Successfully seeded membership plans. Total: ${finalCount.length}`);
  } catch (error) {
    console.error('❌ Error seeding membership plans:', error);
    throw error;
  }
}

// Note: Do NOT run this at module level - it will exit the process
// Call seedMembershipPlans() from server startup instead

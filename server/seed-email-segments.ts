import { storage } from './storage';
import { SegmentFilters } from '@shared/schema';

interface SegmentDefinition {
  name: string;
  description: string;
  filters: SegmentFilters;
  isActive: boolean;
}

const emailSegments: SegmentDefinition[] = [
  {
    name: 'All Teachers',
    description: 'All registered teachers on the platform',
    filters: {
      roles: ['teacher'],
    },
    isActive: true,
  },
  {
    name: 'All Freelancers',
    description: 'All registered freelancers on the platform',
    filters: {
      roles: ['freelancer'],
    },
    isActive: true,
  },
  {
    name: 'All Students',
    description: 'All registered students on the platform',
    filters: {
      roles: ['student'],
    },
    isActive: true,
  },
  {
    name: 'All Customers',
    description: 'All regular users/customers on the platform',
    filters: {
      roles: ['user'],
    },
    isActive: true,
  },
  {
    name: 'Premium Members',
    description: 'Users with premium subscription tier',
    filters: {
      subscriptionTiers: ['premium'],
      hasActiveSubscription: true,
    },
    isActive: true,
  },
  {
    name: 'Free Tier Users',
    description: 'Users on the free tier',
    filters: {
      subscriptionTiers: ['free'],
    },
    isActive: true,
  },
  {
    name: 'Grade 1 Students',
    description: 'Students in Grade 1',
    filters: {
      roles: ['student', 'user'],
      gradeMin: 1,
      gradeMax: 1,
    },
    isActive: true,
  },
  {
    name: 'Grade 2 Students',
    description: 'Students in Grade 2',
    filters: {
      roles: ['student', 'user'],
      gradeMin: 2,
      gradeMax: 2,
    },
    isActive: true,
  },
  {
    name: 'Grade 3 Students',
    description: 'Students in Grade 3',
    filters: {
      roles: ['student', 'user'],
      gradeMin: 3,
      gradeMax: 3,
    },
    isActive: true,
  },
  {
    name: 'Grade 4 Students',
    description: 'Students in Grade 4',
    filters: {
      roles: ['student', 'user'],
      gradeMin: 4,
      gradeMax: 4,
    },
    isActive: true,
  },
  {
    name: 'Grade 5 Students',
    description: 'Students in Grade 5',
    filters: {
      roles: ['student', 'user'],
      gradeMin: 5,
      gradeMax: 5,
    },
    isActive: true,
  },
  {
    name: 'Grade 6 Students',
    description: 'Students in Grade 6',
    filters: {
      roles: ['student', 'user'],
      gradeMin: 6,
      gradeMax: 6,
    },
    isActive: true,
  },
  {
    name: 'Grade 7 Students',
    description: 'Students in Grade 7',
    filters: {
      roles: ['student', 'user'],
      gradeMin: 7,
      gradeMax: 7,
    },
    isActive: true,
  },
  {
    name: 'Primary School (Grade 1-7)',
    description: 'All primary school students (Grades 1-7)',
    filters: {
      roles: ['student', 'user'],
      gradeMin: 1,
      gradeMax: 7,
    },
    isActive: true,
  },
  {
    name: 'Secondary School (Form 1-6)',
    description: 'All secondary school students (Forms 1-6 / Grades 8-13)',
    filters: {
      roles: ['student', 'user'],
      gradeMin: 8,
      gradeMax: 13,
    },
    isActive: true,
  },
  {
    name: 'Form 1 Students',
    description: 'Students in Form 1 (Grade 8)',
    filters: {
      roles: ['student', 'user'],
      gradeMin: 8,
      gradeMax: 8,
    },
    isActive: true,
  },
  {
    name: 'Form 2 Students',
    description: 'Students in Form 2 (Grade 9)',
    filters: {
      roles: ['student', 'user'],
      gradeMin: 9,
      gradeMax: 9,
    },
    isActive: true,
  },
  {
    name: 'Form 3 Students',
    description: 'Students in Form 3 (Grade 10)',
    filters: {
      roles: ['student', 'user'],
      gradeMin: 10,
      gradeMax: 10,
    },
    isActive: true,
  },
  {
    name: 'Form 4 Students',
    description: 'Students in Form 4 (Grade 11)',
    filters: {
      roles: ['student', 'user'],
      gradeMin: 11,
      gradeMax: 11,
    },
    isActive: true,
  },
  {
    name: 'O-Level Students (Form 3-4)',
    description: 'O-Level students (Forms 3-4)',
    filters: {
      roles: ['student', 'user'],
      gradeMin: 10,
      gradeMax: 11,
    },
    isActive: true,
  },
  {
    name: 'A-Level Students (Form 5-6)',
    description: 'A-Level students (Forms 5-6)',
    filters: {
      roles: ['student', 'user'],
      gradeMin: 12,
      gradeMax: 13,
    },
    isActive: true,
  },
  {
    name: 'New Users (Last 7 Days)',
    description: 'Users who registered in the last 7 days',
    filters: {
      registeredAfter: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    isActive: true,
  },
  {
    name: 'New Users (Last 30 Days)',
    description: 'Users who registered in the last 30 days',
    filters: {
      registeredAfter: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    isActive: true,
  },
  {
    name: 'Inactive Users (30+ Days)',
    description: 'Users who have not been active in the last 30 days',
    filters: {
      lastActiveBefore: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    isActive: true,
  },
  {
    name: 'Active Users (Last 7 Days)',
    description: 'Users who have been active in the last 7 days',
    filters: {
      lastActiveAfter: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    isActive: true,
  },
  {
    name: 'Users with Complete Profiles',
    description: 'Users who have completed their profile setup',
    filters: {
      hasCompletedProfile: true,
    },
    isActive: true,
  },
];

export async function seedEmailSegments() {
  console.log('📧 Seeding email marketing segments...');
  
  let seededCount = 0;
  let skippedCount = 0;
  
  for (const segment of emailSegments) {
    try {
      const existingSegments = await storage.getCampaignSegments(false);
      const alreadyExists = existingSegments.some(s => s.name === segment.name);
      
      if (alreadyExists) {
        console.log(`  ⏭️  Segment "${segment.name}" already exists, skipping...`);
        skippedCount++;
        continue;
      }
      
      const estimatedSize = await storage.getSegmentEstimatedSize(segment.filters);
      
      await storage.createCampaignSegment({
        name: segment.name,
        description: segment.description,
        filters: segment.filters,
        estimatedSize,
        isActive: segment.isActive,
      });
      
      console.log(`  ✅ Created segment: ${segment.name} (estimated: ${estimatedSize} users)`);
      seededCount++;
    } catch (error) {
      console.error(`  ❌ Error seeding segment "${segment.name}":`, error instanceof Error ? error.message : error);
    }
  }
  
  console.log(`📧 Email segment seeding complete: ${seededCount} created, ${skippedCount} skipped`);
}

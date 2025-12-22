import { db } from '../server/db';
import { users, profiles, countries } from '@shared/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

const generateUserId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

async function createTestStudents() {
  try {
    console.log('Creating test student accounts...\n');

    // Student 1: Zimbabwe Grade 3
    const zimEmail = 'testzim@socialgrab.app';
    const zimPassword = 'passmore1';
    
    // Check if user already exists
    const existingZimUser = await db
      .select()
      .from(users)
      .where(eq(users.email, zimEmail))
      .limit(1);

    if (existingZimUser.length > 0) {
      console.log(`⚠️  User ${zimEmail} already exists. Skipping creation.`);
    } else {
      // Create Zimbabwe student
      const zimUserId = generateUserId();
      const zimPasswordHash = await bcrypt.hash(zimPassword, 10);

      const zimUser = await db.insert(users).values({
        userId: zimUserId,
        email: zimEmail,
        passwordHash: zimPasswordHash,
        educationLevel: 'primary'
      }).returning();

      await db.insert(profiles).values({
        userId: zimUser[0].id,
        name: 'Zimbabwe Test Student',
        email: zimEmail,
        age: 8,
        grade: 3,
        gradeLevel: '3',
        educationLevel: 'grade',
        country: 'Zimbabwe',
        countryId: 114,
        role: 'student',
        status: 'active',
        isTest: true
      }).returning();

      console.log(`✅ Created Zimbabwe Grade 3 student:`);
      console.log(`   Email: ${zimEmail}`);
      console.log(`   Password: ${zimPassword}`);
      console.log(`   User ID: ${zimUserId}\n`);
    }

    // Student 2: South Africa
    const saEmail = 'testsa@socialgrab.app';
    const saPassword = 'passmore1';
    
    // Check if user already exists
    const existingSaUser = await db
      .select()
      .from(users)
      .where(eq(users.email, saEmail))
      .limit(1);

    if (existingSaUser.length > 0) {
      console.log(`⚠️  User ${saEmail} already exists. Skipping creation.`);
    } else {
      // Create South Africa student
      const saUserId = generateUserId();
      const saPasswordHash = await bcrypt.hash(saPassword, 10);

      const saUser = await db.insert(users).values({
        userId: saUserId,
        email: saEmail,
        passwordHash: saPasswordHash,
        educationLevel: 'primary'
      }).returning();

      await db.insert(profiles).values({
        userId: saUser[0].id,
        name: 'South Africa Test Student',
        email: saEmail,
        age: 8,
        grade: 3,
        gradeLevel: '3',
        educationLevel: 'grade',
        country: 'South Africa',
        countryId: 106,
        role: 'student',
        status: 'active',
        isTest: true
      }).returning();

      console.log(`✅ Created South Africa student:`);
      console.log(`   Email: ${saEmail}`);
      console.log(`   Password: ${saPassword}`);
      console.log(`   User ID: ${saUserId}\n`);
    }

    console.log('✅ Test student creation completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test students:', error);
    process.exit(1);
  }
}

createTestStudents();

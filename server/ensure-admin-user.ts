import { db } from './db';
import { users, profiles, userRoles } from '../shared/schema';
import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcrypt';

/**
 * Ensures there is at least one admin user in the system.
 * Returns the admin user ID.
 */
export async function ensureAdminUser(): Promise<string> {
  try {
    // First, look for an existing admin user
    const existingAdmin = await db
      .select({
        userId: users.id,
        profileId: profiles.id,
        role: profiles.role,
      })
      .from(users)
      .innerJoin(profiles, eq(users.id, profiles.userId))
      .where(eq(profiles.role, 'admin'))
      .limit(1);

    if (existingAdmin.length > 0) {
      console.log('✅ Found existing admin user:', existingAdmin[0].userId);
      return existingAdmin[0].userId;
    }

    // No admin found, create a default system admin
    console.log('📝 No admin user found. Creating default system admin...');
    
    const adminEmail = 'admin@edufiliova.com';
    const adminPassword = 'Admin@2024!'; // Should be changed after first login
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    // Generate 10-digit user ID
    const generateUserId = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < 10; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };

    const userId = generateUserId();

    // Create admin user
    const [newAdminUser] = await db
      .insert(users)
      .values({
        userId,
        email: adminEmail,
        passwordHash,
        educationLevel: 'other',
        hasCompletedProfile: true,
        hasSelectedRole: true,
      })
      .returning();

    console.log('✅ Created admin user:', newAdminUser.id);

    // Create admin profile
    const [adminProfile] = await db
      .insert(profiles)
      .values({
        userId: newAdminUser.id,
        name: 'System Administrator',
        displayName: 'Admin',
        email: adminEmail,
        age: 30,
        grade: 13, // College/University level
        country: 'Global',
        role: 'admin',
        status: 'active',
        bio: 'System administrator account',
      })
      .returning();

    console.log('✅ Created admin profile:', adminProfile.id);

    // Assign admin role
    await db
      .insert(userRoles)
      .values({
        userId: newAdminUser.id,
        role: 'admin',
        isActive: true,
      });

    console.log('✅ Assigned admin role');
    console.log(`
⚠️  IMPORTANT: Default admin credentials created:
   Email: ${adminEmail}
   Password: ${adminPassword}
   User ID: ${userId}
   
   Please change the password after first login!
`);

    return newAdminUser.id;
  } catch (error) {
    console.error('❌ Error ensuring admin user:', error);
    throw error;
  }
}

// Note: Do NOT run this at module level - it will exit the process
// Call ensureAdminUser() from server startup instead

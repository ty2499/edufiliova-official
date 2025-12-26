import { db } from './db';
import { courses, subjects, users, profiles } from '../shared/schema';
import { eq, isNull } from 'drizzle-orm';
import { ensureAdminUser } from './ensure-admin-user';

/**
 * Assigns all system-created courses and subjects to the admin user.
 * This ensures that content created by the system has a proper owner.
 */
async function assignAdminToContent() {
  try {
    console.log('🔍 Starting content ownership assignment...');

    // Ensure admin user exists and get their ID
    const adminUserId = await ensureAdminUser();
    console.log(`✅ Using admin user ID: ${adminUserId}`);

    // Update all courses without a createdBy to admin
    console.log('📝 Updating courses without creator...');
    const updatedCourses = await db
      .update(courses)
      .set({ 
        createdBy: adminUserId,
        instructorId: adminUserId 
      })
      .where(isNull(courses.createdBy))
      .returning({ id: courses.id, title: courses.title });

    console.log(`✅ Updated ${updatedCourses.length} courses to be owned by admin`);
    if (updatedCourses.length > 0) {
      console.log('   Sample courses:', updatedCourses.slice(0, 5).map(c => c.title));
    }

    // Update all subjects to have admin as creator
    // Note: This will only work after the database migration adds the created_by column
    console.log('📝 Updating subjects to assign creator...');
    try {
      const updatedSubjects = await db
        .update(subjects)
        .set({ createdBy: adminUserId })
        .where(isNull(subjects.createdBy))
        .returning({ id: subjects.id, name: subjects.name });

      console.log(`✅ Updated ${updatedSubjects.length} subjects to be owned by admin`);
      if (updatedSubjects.length > 0) {
        console.log('   Sample subjects:', updatedSubjects.slice(0, 5).map(s => s.name));
      }
    } catch (subjectError: any) {
      if (subjectError.message?.includes('column') || subjectError.message?.includes('created_by')) {
        console.log('⚠️  Column "created_by" not yet added to subjects table.');
        console.log('   Run: npm run db:push to add the column, then run this script again.');
      } else {
        throw subjectError;
      }
    }

    console.log('✅ Content ownership assignment complete!');
    console.log(`
📊 Summary:
   - Admin user: ${adminUserId}
   - Courses updated: ${updatedCourses.length}
   - All system content now properly assigned to admin
`);
  } catch (error) {
    console.error('❌ Error assigning admin to content:', error);
    throw error;
  }
}

export { assignAdminToContent };

// Note: Do NOT run this at module level - it will exit the process
// Call assignAdminToContent() from server startup instead

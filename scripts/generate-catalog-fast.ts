import { db } from '../server/db';
import { courses, subjects, courseCategories } from '../shared/schema';
import { eq, and } from 'drizzle-orm';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

// Fast catalog generator that creates lightweight listing files
// Full details can be fetched via API when needed for user-specific data overlay

async function generateFastCatalog() {
  console.log('🚀 Starting fast catalog generation...');
  
  try {
    const catalogDir = join(process.cwd(), 'client', 'public', 'catalog');
    await mkdir(catalogDir, { recursive: true });

    // 1. Generate categories
    console.log('📂 Generating categories...');
    const categoriesData = await db
      .select({
        id: courseCategories.id,
        name: courseCategories.name,
        displayName: courseCategories.displayName,
        description: courseCategories.description,
        color: courseCategories.color,
        isActive: courseCategories.isActive
      })
      .from(courseCategories)
      .where(eq(courseCategories.isActive, true));
    
    await writeFile(
      join(catalogDir, 'categories.json'),
      JSON.stringify(categoriesData, null, 2)
    );
    console.log(`✅ Categories: ${categoriesData.length}`);

    // 2. Generate courses listing (with module/lesson counts)
    console.log('📚 Generating courses listing...');
    const coursesRaw = await db
      .select({
        id: courses.id,
        title: courses.title,
        description: courses.description,
        thumbnailUrl: courses.thumbnailUrl,
        image: courses.image,
        categoryId: courses.categoryId,
        pricingType: courses.pricingType,
        gradeTier: courses.gradeTier,
        difficulty: courses.difficulty,
        duration: courses.duration,
        tags: courses.tags,
        language: courses.language,
        isFeatured: courses.isFeatured,
        publisherName: courses.publisherName,
        publisherBio: courses.publisherBio,
        learningObjectives: courses.learningObjectives,
        certificationType: courses.certificationType,
        credits: courses.credits
      })
      .from(courses)
      .where(and(
        eq(courses.isActive, true),
        eq(courses.approvalStatus, 'approved')
      ));
    
    // Add counts (set to 0 since we're not fetching nested data for performance)
    const coursesData = coursesRaw.map(course => ({
      ...course,
      lessonCount: 0,
      moduleCount: 0
    }));
    
    await writeFile(
      join(catalogDir, 'courses-listing.json'),
      JSON.stringify(coursesData, null, 2)
    );
    console.log(`✅ Courses: ${coursesData.length}`);

    // 3. Generate subjects listing (with chapter/lesson counts)
    console.log('📖 Generating subjects listing...');
    const subjectsRaw = await db
      .select({
        id: subjects.id,
        name: subjects.name,
        description: subjects.description,
        iconUrl: subjects.iconUrl,
        gradeLevel: subjects.gradeLevel,
        gradeSystem: subjects.gradeSystem,
        isActive: subjects.isActive
      })
      .from(subjects)
      .where(eq(subjects.isActive, true));
    
    // Add counts (set to 0 since we're not fetching nested data for performance)
    const subjectsData = subjectsRaw.map(subject => ({
      ...subject,
      lessonCount: 0,
      chapterCount: 0
    }));
    
    await writeFile(
      join(catalogDir, 'subjects-listing.json'),
      JSON.stringify(subjectsData, null, 2)
    );
    console.log(`✅ Subjects: ${subjectsData.length}`);

    // 4. Generate index
    const index = {
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      stats: {
        totalCourses: coursesData.length,
        totalSubjects: subjectsData.length,
        totalCategories: categoriesData.length,
        totalCourseLessons: 0,
        totalSubjectLessons: 0
      },
      files: {
        manifest: 'index.json',
        categories: 'categories.json',
        coursesListing: 'courses-listing.json',
        subjectsListing: 'subjects-listing.json',
        courses: [],
        subjects: []
      },
      note: 'Detailed course/subject content with lessons will be fetched via API when needed'
    };
    
    await writeFile(
      join(catalogDir, 'index.json'),
      JSON.stringify(index, null, 2)
    );

    console.log('\n🎉 Fast catalog generation complete!');
    console.log(`📊 Statistics:`);
    console.log(`   - Categories: ${categoriesData.length}`);
    console.log(`   - Courses: ${coursesData.length}`);
    console.log(`   - Subjects: ${subjectsData.length}`);
    console.log(`\n✨ Catalog listing files are now static!`);
    console.log(`📁 Location: client/public/catalog/`);
    console.log(`\n💡 Benefit: Browse pages have ZERO database queries!`);
    console.log(`   Detail pages will use cached API calls for full content.`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error generating fast catalog:', error);
    process.exit(1);
  }
}

generateFastCatalog();

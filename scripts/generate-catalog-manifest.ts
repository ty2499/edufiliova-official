import { db } from '../server/db';
import { courses, subjects, subjectChapters, subjectLessons, modules, lessons, courseCategories, subjectExercises } from '../shared/schema';
import { eq, and } from 'drizzle-orm';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

interface CatalogManifest {
  version: string;
  generatedAt: string;
  courses: CourseCatalog[];
  subjects: SubjectCatalog[];
  categories: CategoryCatalog[];
}

interface CourseCatalog {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  image: string | null;
  categoryId: string | null;
  pricingType: string;
  gradeTier: string | null;
  isActive: boolean;
  difficulty: string | null;
  duration: number | null;
  learningObjectives: string[] | null;
  certificationType: string | null;
  credits: number | null;
  tags: string[] | null;
  language: string | null;
  publisherName: string | null;
  publisherBio: string | null;
  isFeatured: boolean | null;
  modules: ModuleCatalog[];
  lessonCount: number;
}

interface ModuleCatalog {
  id: string;
  title: string;
  description: string | null;
  orderNum: number;
  lessons: LessonCatalog[];
}

interface LessonCatalog {
  id: number;
  title: string;
  description: string | null;
  content: string | null;
  durationMinutes: number | null;
  order: number | null;
  freePreview: boolean | null;
  videoUrl: string | null;
  images: string[] | null;
}

interface SubjectCatalog {
  id: string;
  name: string;
  description: string | null;
  iconUrl: string | null;
  gradeLevel: number;
  gradeSystem: string;
  isActive: boolean | null;
  chapters: ChapterCatalog[];
  lessonCount: number;
}

interface ChapterCatalog {
  id: string;
  title: string;
  description: string | null;
  order: number;
  isActive: boolean | null;
  lessons: SubjectLessonCatalog[];
}

interface SubjectLessonCatalog {
  id: string;
  title: string;
  notes: string | null;
  examples: string[] | null;
  order: number;
  isActive: boolean | null;
  cloudinaryImages: string[] | null;
  exercises: ExerciseCatalog[];
}

interface ExerciseCatalog {
  id: string;
  question: string;
  options: string[] | null;
  correctAnswer: string | null;
  explanation: string | null;
  order: number;
}

interface CategoryCatalog {
  id: string;
  name: string;
  displayName: string | null;
  description: string | null;
  color: string | null;
  isActive: boolean | null;
}

async function generateCatalogManifest() {
  console.log('🚀 Starting catalog manifest generation...');
  
  try {
    // 1. Fetch all categories
    console.log('📂 Fetching categories...');
    const categoriesData = await db
      .select()
      .from(courseCategories)
      .where(eq(courseCategories.isActive, true))
      .orderBy(courseCategories.name);
    
    const categories: CategoryCatalog[] = categoriesData.map(cat => ({
      id: cat.id,
      name: cat.name,
      displayName: cat.displayName,
      description: cat.description,
      color: cat.color,
      isActive: cat.isActive
    }));
    
    console.log(`✅ Found ${categories.length} categories`);

    // 2. Fetch all active approved courses with their modules and lessons
    console.log('📚 Fetching courses...');
    const coursesData = await db
      .select()
      .from(courses)
      .where(and(
        eq(courses.isActive, true),
        eq(courses.approvalStatus, 'approved')
      ))
      .orderBy(courses.title);
    
    const coursesCatalog: CourseCatalog[] = [];
    
    for (const course of coursesData) {
      console.log(`  Processing course: ${course.title}`);
      
      // Fetch modules for this course
      const modulesData = await db
        .select()
        .from(modules)
        .where(eq(modules.courseId, course.id))
        .orderBy(modules.orderNum);
      
      const modulesWithLessons: ModuleCatalog[] = [];
      let totalLessons = 0;
      
      for (const module of modulesData) {
        // Fetch lessons for this module
        const lessonsData = await db
          .select()
          .from(lessons)
          .where(and(
            eq(lessons.moduleId, module.id),
            eq(lessons.courseId, course.id)
          ))
          .orderBy(lessons.order);
        
        totalLessons += lessonsData.length;
        
        const lessonsCatalog: LessonCatalog[] = lessonsData.map(lesson => ({
          id: lesson.id,
          title: lesson.title,
          description: lesson.description,
          content: lesson.content,
          durationMinutes: lesson.durationMinutes,
          order: lesson.order,
          freePreview: lesson.freePreviewFlag,
          videoUrl: lesson.videoUrl,
          images: lesson.images
        }));
        
        modulesWithLessons.push({
          id: module.id,
          title: module.title,
          description: module.description,
          orderNum: module.orderNum,
          lessons: lessonsCatalog
        });
      }
      
      coursesCatalog.push({
        id: course.id,
        title: course.title,
        description: course.description,
        thumbnailUrl: course.thumbnailUrl,
        image: course.image,
        categoryId: course.categoryId,
        pricingType: course.pricingType,
        gradeTier: course.gradeTier,
        isActive: course.isActive,
        difficulty: course.difficulty,
        duration: course.duration,
        learningObjectives: course.learningObjectives,
        certificationType: course.certificationType,
        credits: course.credits,
        tags: course.tags,
        language: course.language,
        publisherName: course.publisherName,
        publisherBio: course.publisherBio,
        isFeatured: course.isFeatured,
        modules: modulesWithLessons,
        lessonCount: totalLessons
      });
    }
    
    console.log(`✅ Processed ${coursesCatalog.length} courses with ${coursesCatalog.reduce((sum, c) => sum + c.lessonCount, 0)} total lessons`);

    // 3. Fetch all active subjects with chapters and lessons
    console.log('📖 Fetching subjects...');
    const subjectsData = await db
      .select()
      .from(subjects)
      .where(eq(subjects.isActive, true))
      .orderBy(subjects.name);
    
    const subjectsCatalog: SubjectCatalog[] = [];
    
    for (const subject of subjectsData) {
      console.log(`  Processing subject: ${subject.name} (Grade ${subject.gradeLevel})`);
      
      // Fetch chapters for this subject
      const chaptersData = await db
        .select()
        .from(subjectChapters)
        .where(and(
          eq(subjectChapters.subjectId, subject.id),
          eq(subjectChapters.isActive, true)
        ))
        .orderBy(subjectChapters.order);
      
      const chaptersWithLessons: ChapterCatalog[] = [];
      let totalLessons = 0;
      
      for (const chapter of chaptersData) {
        // Fetch lessons for this chapter
        const lessonsData = await db
          .select()
          .from(subjectLessons)
          .where(and(
            eq(subjectLessons.chapterId, chapter.id),
            eq(subjectLessons.isActive, true)
          ))
          .orderBy(subjectLessons.order);
        
        totalLessons += lessonsData.length;
        
        const lessonsWithExercises: SubjectLessonCatalog[] = [];
        
        for (const lesson of lessonsData) {
          // Fetch exercises for this lesson
          const exercisesData = await db
            .select()
            .from(subjectExercises)
            .where(eq(subjectExercises.lessonId, lesson.id))
            .orderBy(subjectExercises.order);
          
          const exercisesCatalog: ExerciseCatalog[] = exercisesData.map(ex => ({
            id: ex.id,
            question: ex.question,
            options: ex.options,
            correctAnswer: ex.correctAnswer,
            explanation: ex.explanation,
            order: ex.order
          }));
          
          lessonsWithExercises.push({
            id: lesson.id,
            title: lesson.title,
            notes: lesson.notes,
            examples: lesson.examples,
            order: lesson.order,
            isActive: lesson.isActive,
            cloudinaryImages: lesson.cloudinaryImages,
            exercises: exercisesCatalog
          });
        }
        
        chaptersWithLessons.push({
          id: chapter.id,
          title: chapter.title,
          description: chapter.description,
          order: chapter.order,
          isActive: chapter.isActive,
          lessons: lessonsWithExercises
        });
      }
      
      subjectsCatalog.push({
        id: subject.id,
        name: subject.name,
        description: subject.description,
        iconUrl: subject.iconUrl,
        gradeLevel: subject.gradeLevel,
        gradeSystem: subject.gradeSystem,
        isActive: subject.isActive,
        chapters: chaptersWithLessons,
        lessonCount: totalLessons
      });
    }
    
    console.log(`✅ Processed ${subjectsCatalog.length} subjects with ${subjectsCatalog.reduce((sum, s) => sum + s.lessonCount, 0)} total lessons`);

    // 4. Create manifest
    const manifest: CatalogManifest = {
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      courses: coursesCatalog,
      subjects: subjectsCatalog,
      categories: categories
    };

    // 5. Create output directory
    const catalogDir = join(process.cwd(), 'client', 'public', 'catalog');
    await mkdir(catalogDir, { recursive: true });

    // 6. Write full manifest
    const manifestPath = join(catalogDir, 'manifest.json');
    await writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
    console.log(`✅ Written full manifest: ${manifestPath}`);

    // 7. Write individual files for better performance (optional optimization)
    
    // Categories file
    const categoriesPath = join(catalogDir, 'categories.json');
    await writeFile(categoriesPath, JSON.stringify(categories, null, 2), 'utf8');
    console.log(`✅ Written categories: ${categoriesPath}`);
    
    // Courses file (without full lesson content for listing pages)
    const coursesListingPath = join(catalogDir, 'courses-listing.json');
    const coursesListing = coursesCatalog.map(c => ({
      id: c.id,
      title: c.title,
      description: c.description,
      thumbnailUrl: c.thumbnailUrl,
      image: c.image,
      categoryId: c.categoryId,
      pricingType: c.pricingType,
      gradeTier: c.gradeTier,
      difficulty: c.difficulty,
      duration: c.duration,
      tags: c.tags,
      language: c.language,
      isFeatured: c.isFeatured,
      lessonCount: c.lessonCount,
      moduleCount: c.modules.length
    }));
    await writeFile(coursesListingPath, JSON.stringify(coursesListing, null, 2), 'utf8');
    console.log(`✅ Written courses listing: ${coursesListingPath}`);
    
    // Individual course files with full content
    for (const course of coursesCatalog) {
      const coursePath = join(catalogDir, `course-${course.id}.json`);
      await writeFile(coursePath, JSON.stringify(course, null, 2), 'utf8');
    }
    console.log(`✅ Written ${coursesCatalog.length} individual course files`);
    
    // Subjects file (without full lesson content for listing pages)
    const subjectsListingPath = join(catalogDir, 'subjects-listing.json');
    const subjectsListing = subjectsCatalog.map(s => ({
      id: s.id,
      name: s.name,
      description: s.description,
      iconUrl: s.iconUrl,
      gradeLevel: s.gradeLevel,
      gradeSystem: s.gradeSystem,
      lessonCount: s.lessonCount,
      chapterCount: s.chapters.length
    }));
    await writeFile(subjectsListingPath, JSON.stringify(subjectsListing, null, 2), 'utf8');
    console.log(`✅ Written subjects listing: ${subjectsListingPath}`);
    
    // Individual subject files with full content
    for (const subject of subjectsCatalog) {
      const subjectPath = join(catalogDir, `subject-${subject.id}.json`);
      await writeFile(subjectPath, JSON.stringify(subject, null, 2), 'utf8');
    }
    console.log(`✅ Written ${subjectsCatalog.length} individual subject files`);

    // 8. Generate index file with metadata
    const indexPath = join(catalogDir, 'index.json');
    const index = {
      version: manifest.version,
      generatedAt: manifest.generatedAt,
      stats: {
        totalCourses: coursesCatalog.length,
        totalSubjects: subjectsCatalog.length,
        totalCategories: categories.length,
        totalCourseLessons: coursesCatalog.reduce((sum, c) => sum + c.lessonCount, 0),
        totalSubjectLessons: subjectsCatalog.reduce((sum, s) => sum + s.lessonCount, 0)
      },
      files: {
        manifest: 'manifest.json',
        categories: 'categories.json',
        coursesListing: 'courses-listing.json',
        subjectsListing: 'subjects-listing.json',
        courses: coursesCatalog.map(c => `course-${c.id}.json`),
        subjects: subjectsCatalog.map(s => `subject-${s.id}.json`)
      }
    };
    await writeFile(indexPath, JSON.stringify(index, null, 2), 'utf8');
    console.log(`✅ Written index: ${indexPath}`);

    console.log('\n🎉 Catalog manifest generation complete!');
    console.log(`📊 Statistics:`);
    console.log(`   - Categories: ${categories.length}`);
    console.log(`   - Courses: ${coursesCatalog.length}`);
    console.log(`   - Subjects: ${subjectsCatalog.length}`);
    console.log(`   - Total Course Lessons: ${coursesCatalog.reduce((sum, c) => sum + c.lessonCount, 0)}`);
    console.log(`   - Total Subject Lessons: ${subjectsCatalog.reduce((sum, s) => sum + s.lessonCount, 0)}`);
    console.log(`\n✨ All catalog data is now available as static JSON files!`);
    console.log(`📁 Location: client/public/catalog/`);
    
    // Close database connection
    process.exit(0);
  } catch (error) {
    console.error('❌ Error generating catalog manifest:', error);
    process.exit(1);
  }
}

// Run the generator
generateCatalogManifest();

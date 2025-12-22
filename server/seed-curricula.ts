import { db } from "./db.js";
import { curricula, countryCurricula, countries } from "../shared/schema.js";
import { eq, and } from "drizzle-orm";

// Default curriculum mappings for various countries
const CURRICULUM_MAPPINGS = [
  {
    name: "Zimbabwe Education System",
    displayName: "Zimbabwe Curriculum",
    description: "Standard Zimbabwe curriculum with O-Level and A-Level structure",
    systemType: "local" as const,
    countryCode: "ZW",
    countries: ["Zimbabwe"]
  },
  {
    name: "Cambridge International",
    displayName: "Cambridge IGCSE/A-Level",
    description: "Cambridge International curriculum with IGCSE and A-Level programs",
    systemType: "cambridge" as const,
    countryCode: "GB", 
    countries: ["United Kingdom", "South Africa", "Kenya", "Nigeria", "Ghana", "Uganda", "Tanzania"]
  },
  {
    name: "American K-12 System",
    displayName: "American Curriculum",
    description: "American K-12 education system with grade-based progression",
    systemType: "american" as const,
    countryCode: "US",
    countries: ["United States", "Canada"]
  },
  {
    name: "All Systems",
    displayName: "Universal Curriculum",
    description: "Generic curriculum suitable for all education systems worldwide",
    systemType: "all_systems" as const,
    countryCode: null,
    countries: [] // No specific countries - this is the fallback
  }
];

export async function seedCurricula() {
  try {
    console.log('🌱 Seeding curricula data...');
    
    // Check if curricula already exist
    const existingCurricula = await db.select().from(curricula).limit(1);
    if (existingCurricula.length > 0) {
      console.log('ℹ️ Curricula already seeded');
      return;
    }

    // Create curricula
    for (const curriculumData of CURRICULUM_MAPPINGS) {
      const [curriculum] = await db.insert(curricula).values({
        name: curriculumData.name,
        displayName: curriculumData.displayName,
        description: curriculumData.description,
        systemType: curriculumData.systemType,
        countryCode: curriculumData.countryCode,
        country: curriculumData.countryCode || 'GLOBAL',
        systemName: curriculumData.name,
        effectiveFrom: new Date()
      }).returning();

      console.log(`✅ Created curriculum: ${curriculum.displayName}`);

      // Map curriculum to countries (skip for "All Systems")
      if (curriculumData.countries.length > 0) {
        for (const countryName of curriculumData.countries) {
          try {
            const countryRecord = await db
              .select()
              .from(countries)
              .where(eq(countries.name, countryName))
              .limit(1);

            if (countryRecord.length > 0) {
              // Check if mapping already exists
              const existingMapping = await db
                .select()
                .from(countryCurricula)
                .where(and(
                  eq(countryCurricula.countryId, countryRecord[0].id),
                  eq(countryCurricula.curriculumId, curriculum.id)
                ))
                .limit(1);

              if (existingMapping.length === 0) {
                await db.insert(countryCurricula).values({
                  countryId: countryRecord[0].id,
                  curriculumId: curriculum.id,
                  isPrimary: true // Set as primary curriculum for this country
                });
                console.log(`  📍 Mapped ${countryName} → ${curriculum.displayName}`);
              }
            } else {
              console.log(`⚠️ Country not found: ${countryName}`);
            }
          } catch (error) {
            console.error(`❌ Error mapping ${countryName}:`, error);
          }
        }
      }
    }

    console.log('✅ Curricula seeding completed successfully');
  } catch (error) {
    console.error('❌ Error seeding curricula:', error);
    throw error;
  }
}
import { db } from "./db.js";
import { countries, gradeSystems } from "../shared/schema.js";
import { eq, count } from "drizzle-orm";

// Grade system configurations for different countries
const gradeSystemsData = {
  // United States (American System)
  "United States": [
    { gradeNumber: 1, displayName: "Grade 1 (1st Grade)", educationLevel: "Elementary", ageRange: "6-7" },
    { gradeNumber: 2, displayName: "Grade 2 (2nd Grade)", educationLevel: "Elementary", ageRange: "7-8" },
    { gradeNumber: 3, displayName: "Grade 3 (3rd Grade)", educationLevel: "Elementary", ageRange: "8-9" },
    { gradeNumber: 4, displayName: "Grade 4 (4th Grade)", educationLevel: "Elementary", ageRange: "9-10" },
    { gradeNumber: 5, displayName: "Grade 5 (5th Grade)", educationLevel: "Elementary", ageRange: "10-11" },
    { gradeNumber: 6, displayName: "Grade 6 (6th Grade)", educationLevel: "Middle School", ageRange: "11-12" },
    { gradeNumber: 7, displayName: "Grade 7 (7th Grade)", educationLevel: "Middle School", ageRange: "12-13" },
    { gradeNumber: 8, displayName: "Grade 8 (8th Grade)", educationLevel: "Middle School", ageRange: "13-14" },
    { gradeNumber: 9, displayName: "Grade 9 (Freshman)", educationLevel: "High School", ageRange: "14-15" },
    { gradeNumber: 10, displayName: "Grade 10 (Sophomore)", educationLevel: "High School", ageRange: "15-16" },
    { gradeNumber: 11, displayName: "Grade 11 (Junior)", educationLevel: "High School", ageRange: "16-17" },
    { gradeNumber: 12, displayName: "Grade 12 (Senior)", educationLevel: "High School", ageRange: "17-18" },
    { gradeNumber: 13, displayName: "College", educationLevel: "College", ageRange: "18+" },
    { gradeNumber: 14, displayName: "University", educationLevel: "University", ageRange: "18+" },
    { gradeNumber: 15, displayName: "Other", educationLevel: "Other", ageRange: "Any" },
  ],
  
  // United Kingdom (British System)
  "United Kingdom": [
    { gradeNumber: 1, displayName: "Year 1", educationLevel: "Key Stage 1", ageRange: "5-6" },
    { gradeNumber: 2, displayName: "Year 2", educationLevel: "Key Stage 1", ageRange: "6-7" },
    { gradeNumber: 3, displayName: "Year 3", educationLevel: "Key Stage 2", ageRange: "7-8" },
    { gradeNumber: 4, displayName: "Year 4", educationLevel: "Key Stage 2", ageRange: "8-9" },
    { gradeNumber: 5, displayName: "Year 5", educationLevel: "Key Stage 2", ageRange: "9-10" },
    { gradeNumber: 6, displayName: "Year 6", educationLevel: "Key Stage 2", ageRange: "10-11" },
    { gradeNumber: 7, displayName: "Year 7", educationLevel: "Key Stage 3", ageRange: "11-12" },
    { gradeNumber: 8, displayName: "Year 8", educationLevel: "Key Stage 3", ageRange: "12-13" },
    { gradeNumber: 9, displayName: "Year 9", educationLevel: "Key Stage 3", ageRange: "13-14" },
    { gradeNumber: 10, displayName: "Year 10 (GCSE)", educationLevel: "Key Stage 4", ageRange: "14-15" },
    { gradeNumber: 11, displayName: "Year 11 (GCSE)", educationLevel: "Key Stage 4", ageRange: "15-16" },
    { gradeNumber: 12, displayName: "Year 12 (A-Level)", educationLevel: "Sixth Form", ageRange: "16-17" },
    { gradeNumber: 13, displayName: "Year 13 (A-Level)", educationLevel: "Sixth Form", ageRange: "17-18" },
    { gradeNumber: 14, displayName: "College", educationLevel: "College", ageRange: "18+" },
    { gradeNumber: 15, displayName: "University", educationLevel: "University", ageRange: "18+" },
    { gradeNumber: 16, displayName: "Other", educationLevel: "Other", ageRange: "Any" },
  ],

  // Canada (Similar to US but with some differences)
  "Canada": [
    { gradeNumber: 1, displayName: "Grade 1", educationLevel: "Elementary", ageRange: "6-7" },
    { gradeNumber: 2, displayName: "Grade 2", educationLevel: "Elementary", ageRange: "7-8" },
    { gradeNumber: 3, displayName: "Grade 3", educationLevel: "Elementary", ageRange: "8-9" },
    { gradeNumber: 4, displayName: "Grade 4", educationLevel: "Elementary", ageRange: "9-10" },
    { gradeNumber: 5, displayName: "Grade 5", educationLevel: "Elementary", ageRange: "10-11" },
    { gradeNumber: 6, displayName: "Grade 6", educationLevel: "Elementary", ageRange: "11-12" },
    { gradeNumber: 7, displayName: "Grade 7", educationLevel: "Middle School", ageRange: "12-13" },
    { gradeNumber: 8, displayName: "Grade 8", educationLevel: "Middle School", ageRange: "13-14" },
    { gradeNumber: 9, displayName: "Grade 9", educationLevel: "High School", ageRange: "14-15" },
    { gradeNumber: 10, displayName: "Grade 10", educationLevel: "High School", ageRange: "15-16" },
    { gradeNumber: 11, displayName: "Grade 11", educationLevel: "High School", ageRange: "16-17" },
    { gradeNumber: 12, displayName: "Grade 12", educationLevel: "High School", ageRange: "17-18" },
    { gradeNumber: 13, displayName: "College", educationLevel: "College", ageRange: "18+" },
    { gradeNumber: 14, displayName: "University", educationLevel: "University", ageRange: "18+" },
    { gradeNumber: 15, displayName: "Other", educationLevel: "Other", ageRange: "Any" },
  ],

  // Australia (Australian System)
  "Australia": [
    { gradeNumber: 1, displayName: "Year 1", educationLevel: "Primary", ageRange: "6-7" },
    { gradeNumber: 2, displayName: "Year 2", educationLevel: "Primary", ageRange: "7-8" },
    { gradeNumber: 3, displayName: "Year 3", educationLevel: "Primary", ageRange: "8-9" },
    { gradeNumber: 4, displayName: "Year 4", educationLevel: "Primary", ageRange: "9-10" },
    { gradeNumber: 5, displayName: "Year 5", educationLevel: "Primary", ageRange: "10-11" },
    { gradeNumber: 6, displayName: "Year 6", educationLevel: "Primary", ageRange: "11-12" },
    { gradeNumber: 7, displayName: "Year 7", educationLevel: "Secondary", ageRange: "12-13" },
    { gradeNumber: 8, displayName: "Year 8", educationLevel: "Secondary", ageRange: "13-14" },
    { gradeNumber: 9, displayName: "Year 9", educationLevel: "Secondary", ageRange: "14-15" },
    { gradeNumber: 10, displayName: "Year 10", educationLevel: "Secondary", ageRange: "15-16" },
    { gradeNumber: 11, displayName: "Year 11", educationLevel: "Senior Secondary", ageRange: "16-17" },
    { gradeNumber: 12, displayName: "Year 12", educationLevel: "Senior Secondary", ageRange: "17-18" },
    { gradeNumber: 13, displayName: "College", educationLevel: "College", ageRange: "18+" },
    { gradeNumber: 14, displayName: "University", educationLevel: "University", ageRange: "18+" },
    { gradeNumber: 15, displayName: "Other", educationLevel: "Other", ageRange: "Any" },
  ],

  // Zimbabwe (Cambridge/Local System)
  "Zimbabwe": [
    { gradeNumber: 1, displayName: "Grade 1 (ECD A)", educationLevel: "Early Childhood", ageRange: "5-6" },
    { gradeNumber: 2, displayName: "Grade 2 (ECD B)", educationLevel: "Early Childhood", ageRange: "6-7" },
    { gradeNumber: 3, displayName: "Grade 3", educationLevel: "Primary", ageRange: "7-8" },
    { gradeNumber: 4, displayName: "Grade 4", educationLevel: "Primary", ageRange: "8-9" },
    { gradeNumber: 5, displayName: "Grade 5", educationLevel: "Primary", ageRange: "9-10" },
    { gradeNumber: 6, displayName: "Grade 6", educationLevel: "Primary", ageRange: "10-11" },
    { gradeNumber: 7, displayName: "Grade 7", educationLevel: "Primary", ageRange: "11-12" },
    { gradeNumber: 8, displayName: "Form 1", educationLevel: "Secondary", ageRange: "12-13" },
    { gradeNumber: 9, displayName: "Form 2", educationLevel: "Secondary", ageRange: "13-14" },
    { gradeNumber: 10, displayName: "Form 3", educationLevel: "Secondary", ageRange: "14-15" },
    { gradeNumber: 11, displayName: "Form 4 (O-Level)", educationLevel: "Secondary", ageRange: "15-16" },
    { gradeNumber: 12, displayName: "Form 5 (A-Level)", educationLevel: "Advanced Secondary", ageRange: "16-17" },
    { gradeNumber: 13, displayName: "Form 6 (A-Level)", educationLevel: "Advanced Secondary", ageRange: "17-18" },
    { gradeNumber: 14, displayName: "College", educationLevel: "College", ageRange: "18+" },
    { gradeNumber: 15, displayName: "University", educationLevel: "University", ageRange: "18+" },
    { gradeNumber: 16, displayName: "Other", educationLevel: "Other", ageRange: "Any" },
  ],
};

// Default grade system for countries not specifically configured
const defaultGradeSystem = [
  { gradeNumber: 1, displayName: "Grade 1", educationLevel: "Primary", ageRange: "6-7" },
  { gradeNumber: 2, displayName: "Grade 2", educationLevel: "Primary", ageRange: "7-8" },
  { gradeNumber: 3, displayName: "Grade 3", educationLevel: "Primary", ageRange: "8-9" },
  { gradeNumber: 4, displayName: "Grade 4", educationLevel: "Primary", ageRange: "9-10" },
  { gradeNumber: 5, displayName: "Grade 5", educationLevel: "Primary", ageRange: "10-11" },
  { gradeNumber: 6, displayName: "Grade 6", educationLevel: "Primary", ageRange: "11-12" },
  { gradeNumber: 7, displayName: "Grade 7", educationLevel: "Secondary", ageRange: "12-13" },
  { gradeNumber: 8, displayName: "Grade 8", educationLevel: "Secondary", ageRange: "13-14" },
  { gradeNumber: 9, displayName: "Grade 9", educationLevel: "Secondary", ageRange: "14-15" },
  { gradeNumber: 10, displayName: "Grade 10", educationLevel: "Secondary", ageRange: "15-16" },
  { gradeNumber: 11, displayName: "Grade 11", educationLevel: "Secondary", ageRange: "16-17" },
  { gradeNumber: 12, displayName: "Grade 12", educationLevel: "Secondary", ageRange: "17-18" },
  { gradeNumber: 13, displayName: "College", educationLevel: "College", ageRange: "18+" },
  { gradeNumber: 14, displayName: "University", educationLevel: "University", ageRange: "18+" },
  { gradeNumber: 15, displayName: "Other", educationLevel: "Other", ageRange: "Any" },
];

export async function seedGradeSystems() {
  try {
    console.log('🔄 Checking grade systems...');

    // Check if grade systems already exist
    const existingGradeSystems = await db
      .select({ count: count() })
      .from(gradeSystems);

    if (existingGradeSystems[0].count > 0) {
      console.log(`ℹ️ Grade systems already seeded (${existingGradeSystems[0].count} grade systems found)`);
      return;
    }

    console.log('📚 Seeding grade systems for all countries...');

    // Get all countries
    const allCountries = await db.select().from(countries);
    console.log(`📍 Found ${allCountries.length} countries to configure grade systems for`);

    let totalGradeSystems = 0;

    for (const country of allCountries) {
      const gradeSystemConfig = gradeSystemsData[country.name as keyof typeof gradeSystemsData] || defaultGradeSystem;
      
      // Insert grade systems for this country
      const gradeSystemsToInsert = gradeSystemConfig.map((grade: any) => ({
        countryId: country.id,
        gradeNumber: grade.gradeNumber,
        displayName: grade.displayName,
        educationLevel: grade.educationLevel,
        ageRange: grade.ageRange,
      }));

      await db.insert(gradeSystems).values(gradeSystemsToInsert);
      totalGradeSystems += gradeSystemsToInsert.length;

      console.log(`✅ Added ${gradeSystemsToInsert.length} grade systems for ${country.name}`);
    }

    console.log(`✅ Successfully seeded ${totalGradeSystems} grade systems for ${allCountries.length} countries`);

  } catch (error) {
    console.error('❌ Error seeding grade systems:', error);
    throw error;
  }
}
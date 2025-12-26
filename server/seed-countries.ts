import { db } from './db.js';
import { countries } from '../shared/schema.js';
import { WORLD_COUNTRIES } from './world-countries-data.js';

export async function seedCountries() {
  try {
    // Check if countries are already seeded
    const existingCountries = await db.select().from(countries);
    
    if (existingCountries.length >= 197) {
      console.log(`ℹ️ Countries already seeded (${existingCountries.length} countries found)`);
      return;
    }

    console.log('🌍 Seeding missing world countries...');
    console.log(`Found ${existingCountries.length} existing countries`);

    // Get existing country codes to avoid duplicates
    const existingCodes = new Set(existingCountries.map(c => c.code));

    // Filter out countries that already exist
    const newCountries = WORLD_COUNTRIES.filter(country => !existingCodes.has(country.code));

    if (newCountries.length === 0) {
      console.log('ℹ️ All countries already exist');
      return;
    }

    console.log(`Adding ${newCountries.length} new countries...`);

    // Insert only new countries
    await db.insert(countries).values(
      newCountries.map(country => ({
        code: country.code,
        name: country.name,
        gradeSystemType: country.gradeSystemType
      }))
    );

    const finalCount = await db.select().from(countries);
    console.log(`✅ Successfully seeded countries. Total: ${finalCount.length}`);

    if (finalCount.length !== 197) {
      console.log(`📊 Expected 197 countries, currently have ${finalCount.length}`);
      
      // Show missing countries count
      const missingCount = 197 - finalCount.length;
      if (missingCount > 0) {
        console.log(`⚠️ Still missing ${missingCount} countries`);
      }
    }
  } catch (error) {
    console.error('❌ Error seeding countries:', error);
    throw error;
  }
}

// Note: Do NOT run this at module level - it will exit the process
// Call seedCountries() from server startup instead
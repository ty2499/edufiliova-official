import { seedWorldCities } from './seed-world-cities';

console.log('🌍 Starting world cities seeding process...');

(async () => {
  try {
    const result = await seedWorldCities();
    console.log('\n📊 Seeding Results:', result);
    
    if (result.success) {
      console.log('\n✅ Cities seeding completed successfully!');
      process.exit(0);
    } else {
      console.log('\n❌ Cities seeding failed:', result.error);
      process.exit(1);
    }
  } catch (error) {
    console.error('\n💥 Seeding process crashed:', error);
    process.exit(1);
  }
})();
import { seedEnglishGrade3Zimbabwe } from './seed-english-grade3-zimbabwe.js';

console.log('📚 Starting Grade 3 English Language (Zimbabwe) seeding...');

(async () => {
  try {
    await seedEnglishGrade3Zimbabwe();
    console.log('✅ Grade 3 English Language seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Grade 3 English Language seeding failed:', error);
    process.exit(1);
  }
})();

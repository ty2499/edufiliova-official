import { seedMathematicsGrade3Zimbabwe } from './seed-mathematics-grade3-zimbabwe.js';

console.log('🔢 Starting Grade 3 Mathematics (Zimbabwe) seeding...');

(async () => {
  try {
    await seedMathematicsGrade3Zimbabwe();
    console.log('✅ Grade 3 Mathematics seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Grade 3 Mathematics seeding failed:', error);
    process.exit(1);
  }
})();

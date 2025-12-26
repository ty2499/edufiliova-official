import { seedChineseLessons } from './seed-chinese-lessons';

async function runSeedChinese() {
  console.log('🎯 Running Chinese Language seeding...');
  
  try {
    await seedChineseLessons();
    console.log('🎉 Chinese Language seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Chinese Language seeding failed:', error);
    process.exit(1);
  }
}

runSeedChinese();
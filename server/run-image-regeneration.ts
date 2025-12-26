import { regenerateAllImages } from './regenerate-lesson-images';

async function main() {
  console.log('\n🚀 STARTING IMAGE REGENERATION WITH OPENAI + R2\n');
  console.log('This will regenerate all course and lesson images...\n');

  try {
    const results = await regenerateAllImages();
    
    console.log('\n✅ REGENERATION COMPLETE');
    console.log('='.repeat(50));
    console.log('LESSONS:');
    console.log(`  Processed: ${results.lessons.processed}`);
    console.log(`  Generated: ${results.lessons.generated}`);
    console.log(`  Failed: ${results.lessons.failed}`);
    console.log('COURSES:');
    console.log(`  Processed: ${results.courses.processed}`);
    console.log(`  Generated: ${results.courses.generated}`);
    console.log(`  Failed: ${results.courses.failed}`);
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('❌ REGENERATION FAILED:', error);
    process.exit(1);
  }
}

main();

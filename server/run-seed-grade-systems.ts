import { seedGradeSystems } from "./seed-grade-systems.js";

// Run the seeding function directly
seedGradeSystems()
  .then(() => {
    console.log('✅ Grade systems seeding completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Grade systems seeding failed:', error);
    process.exit(1);
  });
import { generateGrade9MathBook } from './generate-grade9-math-book';

generateGrade9MathBook()
  .then(result => {
    console.log('Generation completed:', result);
    process.exit(0);
  })
  .catch(error => {
    console.error('Generation failed:', error);
    process.exit(1);
  });

import { cloudflareR2Storage } from './cloudflare-r2-storage';
import fs from 'fs';
import path from 'path';

const GENERATED_IMAGES_DIR = 'attached_assets/generated_images';

const ENGLISH_IMAGES = [
  'english_grammar_complex_sentences.png',
  'english_conditional_sentences.png',
  'english_reported_speech.png',
  'english_modal_verbs.png',
  'english_advanced_punctuation.png',
  'english_finding_main_ideas.png',
  'english_making_inferences.png',
  'english_author_purpose.png',
  'english_comparing_texts.png',
  'english_critical_reading.png',
  'english_essay_structure.png',
  'english_argumentative_writing.png',
  'english_narrative_techniques.png',
  'english_descriptive_writing.png',
  'english_editing_revision.png',
  'english_context_clues.png',
  'english_prefixes_suffixes.png',
  'english_word_roots.png',
  'english_synonyms_antonyms.png',
  'english_academic_vocabulary.png',
  'english_elements_fiction.png',
  'english_poetry_analysis.png',
  'english_drama_elements.png',
  'english_character_development.png',
  'english_literary_themes.png'
];

const MATH_IMAGES = [
  'math_algebraic_expressions.png',
  'math_linear_equations.png',
  'math_polynomials.png',
  'math_solving_equations.png',
  'math_exponents_powers.png',
  'math_factoring.png',
  'math_geometry_angles.png',
  'math_pythagorean_theorem.png',
  'math_area_perimeter.png',
  'math_volume_3d_shapes.png',
  'math_ratios_proportions.png',
  'math_percentages_fractions.png',
  'math_statistics_data.png',
  'math_probability.png',
  'math_functions_graphs.png',
  'math_inequalities.png',
  'math_coordinate_geometry.png'
];

const SCIENCE_IMAGES = ['science_cell_biology.png'];
const SOCIAL_IMAGES = ['social_studies_ancient_civilizations.png'];
const LIFE_IMAGES = ['life_skills_nutrition_basics.png'];

async function uploadImage(imagePath: string, folder: string): Promise<string | null> {
  try {
    if (!fs.existsSync(imagePath)) return null;
    const buffer = fs.readFileSync(imagePath);
    const result = await cloudflareR2Storage.uploadFile(buffer, path.basename(imagePath), 'image/png', folder);
    return result.success ? result.url || null : null;
  } catch { return null; }
}

async function updateBookWithImages(bookFile: string, folder: string, images: string[]): Promise<number> {
  const bookPath = path.join(process.cwd(), bookFile);
  if (!fs.existsSync(bookPath)) return 0;
  
  const book = JSON.parse(fs.readFileSync(bookPath, 'utf-8'));
  let updated = 0;
  let imageIndex = 0;

  for (const chapter of book.book.chapters) {
    for (const lesson of chapter.lessons) {
      if (imageIndex < images.length) {
        const imagePath = path.join(process.cwd(), GENERATED_IMAGES_DIR, images[imageIndex]);
        if (fs.existsSync(imagePath)) {
          console.log(`📤 Uploading: ${images[imageIndex]} for "${lesson.title}"`);
          const url = await uploadImage(imagePath, folder);
          if (url) {
            lesson.mediaUrl = url;
            updated++;
            console.log(`  ✅ ${url}`);
          }
        }
      }
      imageIndex++;
    }
  }

  if (updated > 0) {
    fs.writeFileSync(bookPath, JSON.stringify(book, null, 2));
    console.log(`💾 Saved ${bookFile} with ${updated} new images\n`);
  }
  return updated;
}

async function main() {
  console.log('\n🚀 Uploading All Grade 8 Images to Cloudflare R2\n');
  
  if (!cloudflareR2Storage.isConfigured()) {
    throw new Error('R2 not configured');
  }

  let total = 0;
  
  console.log('📚 English Language Arts:');
  total += await updateBookWithImages('grade8_english_book.json', 'grade8/english/images', ENGLISH_IMAGES);
  
  console.log('📚 Mathematics:');
  total += await updateBookWithImages('grade8_mathematics_book.json', 'grade8/mathematics/images', MATH_IMAGES);
  
  console.log('📚 Science:');
  total += await updateBookWithImages('grade8_science_book.json', 'grade8/science/images', SCIENCE_IMAGES);
  
  console.log('📚 Social Studies:');
  total += await updateBookWithImages('grade8_social_studies_book.json', 'grade8/social_studies/images', SOCIAL_IMAGES);
  
  console.log('📚 Life Skills:');
  total += await updateBookWithImages('grade8_life_skills_book.json', 'grade8/life_skills/images', LIFE_IMAGES);

  console.log(`\n✅ Total images uploaded: ${total}\n`);
}

main().catch(console.error);

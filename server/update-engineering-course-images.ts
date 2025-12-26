import { db } from './db';
import { lessons, courses } from '../shared/schema';
import { eq } from 'drizzle-orm';

const lessonImageMap: Record<number, string> = {
  338: '/attached_assets/generated_images/engineering_workspace_blueprints.png',
  339: '/attached_assets/generated_images/engineering_impact_city.png',
  340: '/attached_assets/generated_images/ancient_engineering_aqueduct.png',
  341: '/attached_assets/generated_images/engineering_disciplines_overview.png',
  342: '/attached_assets/generated_images/engineer_thinking_mindset.png',
  343: '/attached_assets/generated_images/design_process_flowchart.png',
  344: '/attached_assets/generated_images/problem_definition_analysis.png',
  345: '/attached_assets/generated_images/generating_solutions_ideas.png',
  346: '/attached_assets/generated_images/prototype_testing_lab.png',
  347: '/attached_assets/generated_images/iteration_improvement_cycle.png',
  348: '/attached_assets/generated_images/forces_motion_physics.png',
  349: '/attached_assets/generated_images/energy_power_electricity.png',
  350: '/attached_assets/generated_images/mathematics_engineering_tools.png',
  351: '/attached_assets/generated_images/measurement_precision_tools.png',
  352: '/attached_assets/generated_images/safety_engineering_equipment.png',
  353: '/attached_assets/generated_images/civil_engineering_bridge.png',
  354: '/attached_assets/generated_images/mechanical_engineering_gears.png',
  355: '/attached_assets/generated_images/electrical_circuit_board.png',
  356: '/attached_assets/generated_images/chemical_engineering_lab.png',
  357: '/attached_assets/generated_images/emerging_technology_robotics.png',
  358: '/attached_assets/generated_images/materials_science_samples.png',
  359: '/attached_assets/generated_images/structural_framework_building.png',
  360: '/attached_assets/generated_images/tension_compression_bridge.png',
  361: '/attached_assets/generated_images/stability_balance_foundation.png',
  362: '/attached_assets/generated_images/structural_failure_inspection.png',
  363: '/attached_assets/generated_images/problem_solving_puzzle.png',
  364: '/attached_assets/generated_images/critical_thinking_analysis.png',
  365: '/attached_assets/generated_images/constraints_time_resources.png',
  366: '/attached_assets/generated_images/team_collaboration_engineering.png',
  367: '/attached_assets/generated_images/career_path_future.png',
};

function removeEmojis(text: string): string {
  return text.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{2300}-\u{23FF}]|[\u{25A0}-\u{25FF}]|[\u{2B00}-\u{2BFF}]/gu, '');
}

function updateImageInContent(content: string, newImageUrl: string, lessonTitle: string): string {
  const imgRegex = /<img\s+src="[^"]*"[^>]*>/gi;
  const newImg = `<img src="${newImageUrl}" alt="${lessonTitle}" style="width: 100%; max-width: 700px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" />`;
  return content.replace(imgRegex, newImg);
}

export async function updateEngineeringCourseImages() {
  console.log('Starting update of Engineering for Beginners course...');
  
  const [course] = await db.select().from(courses).where(eq(courses.title, 'Engineering for Beginners'));
  if (!course) {
    console.log('Course not found');
    return;
  }

  console.log(`Found course: ${course.title}`);

  for (const [lessonIdStr, newImageUrl] of Object.entries(lessonImageMap)) {
    const lessonId = parseInt(lessonIdStr);
    
    try {
      const [lesson] = await db.select().from(lessons).where(eq(lessons.id, lessonId));
      if (!lesson) {
        console.log(`Lesson ${lessonId} not found, skipping...`);
        continue;
      }

      let updatedContent = lesson.content || '';
      
      updatedContent = removeEmojis(updatedContent);
      
      updatedContent = updateImageInContent(updatedContent, newImageUrl, lesson.title);

      await db.update(lessons)
        .set({
          content: updatedContent,
          images: [newImageUrl]
        })
        .where(eq(lessons.id, lessonId));

      console.log(`Updated lesson ${lessonId}: ${lesson.title}`);
    } catch (error) {
      console.error(`Error updating lesson ${lessonId}:`, error);
    }
  }

  console.log('Engineering for Beginners course update complete!');
}

updateEngineeringCourseImages()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });

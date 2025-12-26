import { db } from './db';
import { lessonContentBlocks, lessons, modules, courses } from '../shared/schema';
import { eq, and, sql } from 'drizzle-orm';

const IMAGE_MAPPING: Record<number, string[]> = {
  521: [
    '/attached_assets/generated_images/dslr_camera_product_shot.png',
    '/attached_assets/generated_images/camera_types_comparison.png',
    '/attached_assets/generated_images/camera_aperture_mechanism_closeup.png'
  ],
  522: [
    '/attached_assets/generated_images/camera_aperture_mechanism_closeup.png',
    '/attached_assets/generated_images/depth_of_field_comparison.png',
    '/attached_assets/generated_images/camera_iso_dial_closeup.png'
  ],
  523: [
    '/attached_assets/generated_images/depth_of_field_comparison.png',
    '/attached_assets/generated_images/portrait_with_bokeh.png',
    '/attached_assets/generated_images/camera_aperture_mechanism_closeup.png'
  ],
  524: [
    '/attached_assets/generated_images/motion_blur_racing_car.png',
    '/attached_assets/generated_images/frozen_water_splash.png',
    '/attached_assets/generated_images/tripod_light_trails.png'
  ],
  525: [
    '/attached_assets/generated_images/camera_iso_dial_closeup.png',
    '/attached_assets/generated_images/dslr_camera_product_shot.png',
    '/attached_assets/generated_images/portrait_with_bokeh.png'
  ],
  526: [
    '/attached_assets/generated_images/dslr_camera_product_shot.png',
    '/attached_assets/generated_images/portrait_with_bokeh.png',
    '/attached_assets/generated_images/eagle_in_flight.png'
  ],
  527: [
    '/attached_assets/generated_images/camera_iso_dial_closeup.png',
    '/attached_assets/generated_images/golden_hour_sunset.png',
    '/attached_assets/generated_images/blue_hour_cityscape.png'
  ],
  528: [
    '/attached_assets/generated_images/rule_of_thirds_landscape.png',
    '/attached_assets/generated_images/portrait_with_bokeh.png',
    '/attached_assets/generated_images/foggy_mountain_landscape.png'
  ],
  529: [
    '/attached_assets/generated_images/leading_lines_forest_road.png',
    '/attached_assets/generated_images/tripod_light_trails.png',
    '/attached_assets/generated_images/foggy_mountain_landscape.png'
  ],
  530: [
    '/attached_assets/generated_images/foggy_mountain_landscape.png',
    '/attached_assets/generated_images/temple_symmetry_reflection.png',
    '/attached_assets/generated_images/leading_lines_forest_road.png'
  ],
  531: [
    '/attached_assets/generated_images/temple_symmetry_reflection.png',
    '/attached_assets/generated_images/color_wheel_arrangement.png',
    '/attached_assets/generated_images/minimalist_red_chair.png'
  ],
  532: [
    '/attached_assets/generated_images/minimalist_red_chair.png',
    '/attached_assets/generated_images/foggy_mountain_landscape.png',
    '/attached_assets/generated_images/portrait_with_bokeh.png'
  ],
  533: [
    '/attached_assets/generated_images/color_wheel_arrangement.png',
    '/attached_assets/generated_images/golden_hour_sunset.png',
    '/attached_assets/generated_images/blue_hour_cityscape.png'
  ],
  534: [
    '/attached_assets/generated_images/portrait_with_bokeh.png',
    '/attached_assets/generated_images/minimalist_red_chair.png',
    '/attached_assets/generated_images/tripod_light_trails.png'
  ],
  567: [
    '/attached_assets/generated_images/window_light_portrait.png',
    '/attached_assets/generated_images/golden_hour_sunset.png',
    '/attached_assets/generated_images/studio_flash_photography.png'
  ],
  568: [
    '/attached_assets/generated_images/rembrandt_portrait_lighting.png',
    '/attached_assets/generated_images/window_light_portrait.png',
    '/attached_assets/generated_images/studio_flash_photography.png'
  ],
  569: [
    '/attached_assets/generated_images/golden_hour_sunset.png',
    '/attached_assets/generated_images/blue_hour_cityscape.png',
    '/attached_assets/generated_images/foggy_mountain_landscape.png'
  ],
  570: [
    '/attached_assets/generated_images/harsh_sunlight_shadows.png',
    '/attached_assets/generated_images/harsh_light_portrait_example.png',
    '/attached_assets/generated_images/photographer_using_reflector.png'
  ],
  571: [
    '/attached_assets/generated_images/indoor_low_light_cafe.png',
    '/attached_assets/generated_images/window_light_portrait.png',
    '/attached_assets/generated_images/camera_iso_dial_closeup.png'
  ],
  572: [
    '/attached_assets/generated_images/studio_flash_photography.png',
    '/attached_assets/generated_images/rembrandt_portrait_lighting.png',
    '/attached_assets/generated_images/portrait_with_bokeh.png'
  ],
  573: [
    '/attached_assets/generated_images/photographer_using_reflector.png',
    '/attached_assets/generated_images/studio_flash_photography.png',
    '/attached_assets/generated_images/window_light_portrait.png'
  ],
  575: [
    '/attached_assets/generated_images/portrait_with_bokeh.png',
    '/attached_assets/generated_images/dslr_camera_product_shot.png',
    '/attached_assets/generated_images/depth_of_field_comparison.png'
  ],
  576: [
    '/attached_assets/generated_images/portrait_with_bokeh.png',
    '/attached_assets/generated_images/rembrandt_portrait_lighting.png',
    '/attached_assets/generated_images/family_group_portrait.png'
  ],
  577: [
    '/attached_assets/generated_images/rembrandt_portrait_lighting.png',
    '/attached_assets/generated_images/studio_flash_photography.png',
    '/attached_assets/generated_images/portrait_with_bokeh.png'
  ],
  578: [
    '/attached_assets/generated_images/window_light_portrait.png',
    '/attached_assets/generated_images/golden_hour_sunset.png',
    '/attached_assets/generated_images/photographer_using_reflector.png'
  ],
  579: [
    '/attached_assets/generated_images/portrait_with_bokeh.png',
    '/attached_assets/generated_images/family_group_portrait.png',
    '/attached_assets/generated_images/artist_environmental_portrait.png'
  ],
  580: [
    '/attached_assets/generated_images/artist_environmental_portrait.png',
    '/attached_assets/generated_images/window_light_portrait.png',
    '/attached_assets/generated_images/portrait_with_bokeh.png'
  ],
  581: [
    '/attached_assets/generated_images/family_group_portrait.png',
    '/attached_assets/generated_images/portrait_with_bokeh.png',
    '/attached_assets/generated_images/photographer_using_reflector.png'
  ],
  583: [
    '/attached_assets/generated_images/rule_of_thirds_landscape.png',
    '/attached_assets/generated_images/foggy_mountain_landscape.png',
    '/attached_assets/generated_images/leading_lines_forest_road.png'
  ],
  584: [
    '/attached_assets/generated_images/tripod_light_trails.png',
    '/attached_assets/generated_images/long_exposure_waterfall.png',
    '/attached_assets/generated_images/foggy_mountain_landscape.png'
  ],
  585: [
    '/attached_assets/generated_images/foggy_mountain_landscape.png',
    '/attached_assets/generated_images/golden_hour_sunset.png',
    '/attached_assets/generated_images/blue_hour_cityscape.png'
  ],
  586: [
    '/attached_assets/generated_images/long_exposure_waterfall.png',
    '/attached_assets/generated_images/tripod_light_trails.png',
    '/attached_assets/generated_images/milky_way_night_sky.png'
  ],
  587: [
    '/attached_assets/generated_images/eagle_in_flight.png',
    '/attached_assets/generated_images/butterfly_macro_photo.png',
    '/attached_assets/generated_images/foggy_mountain_landscape.png'
  ],
  588: [
    '/attached_assets/generated_images/butterfly_macro_photo.png',
    '/attached_assets/generated_images/flower_macro_photography.png',
    '/attached_assets/generated_images/insect_eye_macro_detail.png'
  ],
  589: [
    '/attached_assets/generated_images/milky_way_night_sky.png',
    '/attached_assets/generated_images/tripod_light_trails.png',
    '/attached_assets/generated_images/blue_hour_cityscape.png'
  ],
  590: [
    '/attached_assets/generated_images/photo_editing_workspace.png',
    '/attached_assets/generated_images/before_after_photo_edit.png',
    '/attached_assets/generated_images/photography_gallery_portfolio.png'
  ]
};

export async function updatePhotographyImages() {
  console.log('🖼️ Updating Photography Course Images...');
  
  for (const [lessonIdStr, newImages] of Object.entries(IMAGE_MAPPING)) {
    const lessonId = parseInt(lessonIdStr);
    
    try {
      const contentBlocks = await db.select()
        .from(lessonContentBlocks)
        .where(eq(lessonContentBlocks.lessonId, lessonId));
      
      if (contentBlocks.length === 0) {
        console.log(`⚠️ No content block found for lesson ${lessonId}`);
        continue;
      }
      
      let content = contentBlocks[0].content || '';
      
      const heroImageRegex = /<div class="hero-image"[^>]*>[\s\S]*?<img src="[^"]*"/;
      const midLessonImageRegex = /<div class="mid-lesson-image"[^>]*>[\s\S]*?<img src="[^"]*"/;
      const exampleImageRegex = /<div class="example-image"[^>]*>[\s\S]*?<img src="[^"]*"/;
      
      if (newImages[0]) {
        content = content.replace(
          /<div class="hero-image"[^>]*>[\s\S]*?<img src="[^"]*"/,
          `<div class="hero-image" style="margin-bottom: 30px;">
    <img src="${newImages[0]}"`
        );
      }
      
      if (newImages[1]) {
        content = content.replace(
          /<div class="mid-lesson-image"[^>]*>[\s\S]*?<img src="[^"]*"/,
          `<div class="mid-lesson-image" style="margin: 30px 0; text-align: center;">
    <img src="${newImages[1]}"`
        );
      }
      
      if (newImages[2]) {
        content = content.replace(
          /<div class="example-image"[^>]*>[\s\S]*?<img src="[^"]*"/,
          `<div class="example-image" style="margin: 30px 0; text-align: center;">
    <img src="${newImages[2]}"`
        );
      }
      
      await db.update(lessonContentBlocks)
        .set({ content })
        .where(eq(lessonContentBlocks.lessonId, lessonId));
      
      console.log(`✅ Updated images for lesson ${lessonId}`);
      
    } catch (error) {
      console.error(`❌ Error updating lesson ${lessonId}:`, error);
    }
  }
  
  console.log('🎉 Photography Course Images Updated!');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  updatePhotographyImages()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Failed:', error);
      process.exit(1);
    });
}

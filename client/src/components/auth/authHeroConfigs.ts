// R2 and Uploaded images
const creativeImg = "https://wnr.1d5.myftpupload.com/wp-content/uploads/2025/12/creator_in_design_studio.png";
const profile1 = "https://wnr.1d5.myftpupload.com/wp-content/uploads/2025/12/young_woman_professional_headshot.png";
const profile2 = "https://wnr.1d5.myftpupload.com/wp-content/uploads/2025/12/man_professional_headshot_portrait.png";
const profile3 = "https://wnr.1d5.myftpupload.com/wp-content/uploads/2025/12/young_woman_professional_headshot-2.png";
const profile4 = "https://pub-ef49f2e140c14d1e8242964b30306699.r2.dev/assets/64dbcad6-05ef-4f05-a5aa-635a792bcad2.png";
const profile5 = "https://pub-ef49f2e140c14d1e8242964b30306699.r2.dev/assets/99a93a2e-c8df-4163-b5c0-6e1e25f314ed.png";
const profile6 = "https://pub-ef49f2e140c14d1e8242964b30306699.r2.dev/assets/b5d27229-704c-4429-9c91-73f3a5ce64c2.png";

export interface AuthHeroConfig {
  title: string;
  subtitle: string;
  backgroundImage?: string;
  profileImages?: string[];
  showRating?: boolean;
  rating?: number;
  testimonial?: string;
}

export const authHeroConfigs = {
  student: {
    title: 'Welcome back to\nEduFiliova.',
    subtitle: 'Sign in to continue your learning journey.',
    backgroundImage: creativeImg,
    profileImages: [profile1, profile2, profile3, profile4],
    showRating: true,
    rating: 5.0,
    testimonial: 'The platform that helped me excel in my studies and connect with amazing teachers.'
  } as AuthHeroConfig,

  teacher: {
    title: 'Welcome back,\nEducator.',
    subtitle: 'Continue inspiring students and managing your classes.',
    backgroundImage: creativeImg,
    profileImages: [profile5, profile6, profile1, profile2],
    showRating: true,
    rating: 4.9,
    testimonial: 'Teaching here has been incredibly rewarding. The tools make everything so much easier.'
  } as AuthHeroConfig,

  freelancer: {
    title: 'Join thousands of\ncreators making money.',
    subtitle: 'Start your freelancing journey today.',
    backgroundImage: creativeImg,
    profileImages: [profile1, profile2, profile3, profile4, profile5, profile6],
    showRating: true,
    rating: 5.0,
    testimonial: 'I\'ve built an amazing client base and grown my business through this platform.'
  } as AuthHeroConfig,

  general: {
    title: 'Welcome to\nEduFiliova.',
    subtitle: 'Your gateway to learning, teaching, and creating.',
    backgroundImage: creativeImg,
    profileImages: [profile1, profile2, profile3, profile4],
    showRating: true,
    rating: 5.0,
    testimonial: 'A platform that brings together learners and educators from around the world.'
  } as AuthHeroConfig
};

export default authHeroConfigs;

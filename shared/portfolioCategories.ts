// Portfolio categories used across the platform
export const PORTFOLIO_CATEGORIES = [
  'IT & Programming',
  'Design & Creative',
  'Mobile Apps & Games',
  'HTML / CSS',
  'Tailwind CSS',
  'Web Design',
  'UI/UX Design',
  'InDesign',
  'XD',
  'Premiere Pro',
  'After Effects',
  'Illustrator',
  'Photoshop',
  'Dimension',
  'Capture',
  'Substance 3D Designer',
  'Substance 3D Painter',
  'Substance 3D Sampler',
  'Substance 3D Stager',
  'Landing Page Design',
] as const;

export type PortfolioCategory = typeof PORTFOLIO_CATEGORIES[number];

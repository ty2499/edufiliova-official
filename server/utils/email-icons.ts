export const EMAIL_ICONS = {
  approved: `<img src="data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
    <circle cx="24" cy="24" r="22" fill="#10B981"/>
    <path d="M15 24L21 30L33 18" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`).toString('base64')}" alt="Approved" style="width:48px;height:48px;vertical-align:middle;" />`,

  rejected: `<img src="data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
    <circle cx="24" cy="24" r="22" fill="#0C332C"/>
    <path d="M16 16L32 32M32 16L16 32" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`).toString('base64')}" alt="Rejected" style="width:48px;height:48px;vertical-align:middle;" />`,

  warning: `<img src="data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
    <path d="M24 4L44 40H4L24 4Z" fill="#F59E0B"/>
    <path d="M24 18V28M24 32V34" stroke="white" stroke-width="3" stroke-linecap="round"/>
  </svg>`).toString('base64')}" alt="Warning" style="width:48px;height:48px;vertical-align:middle;" />`,

  pending: `<img src="data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
    <circle cx="24" cy="24" r="22" fill="#3B82F6"/>
    <circle cx="24" cy="24" r="14" stroke="white" stroke-width="3"/>
    <path d="M24 16V24L30 28" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`).toString('base64')}" alt="Pending" style="width:48px;height:48px;vertical-align:middle;" />`,

  underReview: `<img src="data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
    <circle cx="24" cy="24" r="22" fill="#6366F1"/>
    <circle cx="24" cy="24" r="8" stroke="white" stroke-width="3"/>
    <line x1="30" y1="30" x2="38" y2="38" stroke="white" stroke-width="3" stroke-linecap="round"/>
  </svg>`).toString('base64')}" alt="Under Review" style="width:48px;height:48px;vertical-align:middle;" />`,

  celebration: `<img src="data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
    <rect x="3" y="3" width="42" height="42" rx="8" fill="#0C332C"/>
    <path d="M24 10L26.5 19.5L36 22L26.5 24.5L24 34L21.5 24.5L12 22L21.5 19.5L24 10Z" fill="white"/>
    <circle cx="36" cy="12" r="3" fill="#FCD34D"/>
    <circle cx="12" cy="36" r="3" fill="#FCD34D"/>
    <circle cx="38" cy="36" r="2" fill="#FCD34D"/>
    <circle cx="10" cy="12" r="2" fill="#FCD34D"/>
  </svg>`).toString('base64')}" alt="Celebration" style="width:48px;height:48px;vertical-align:middle;" />`,

  welcome: `<img src="data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
    <circle cx="24" cy="24" r="22" fill="#10B981"/>
    <path d="M14 24C14 24 18 30 24 30C30 30 34 24 34 24" stroke="white" stroke-width="3" stroke-linecap="round"/>
    <circle cx="18" cy="20" r="2" fill="white"/>
    <circle cx="30" cy="20" r="2" fill="white"/>
    <path d="M30 10L32 8M36 14L38 12M34 20L36 20" stroke="#FCD34D" stroke-width="2" stroke-linecap="round"/>
  </svg>`).toString('base64')}" alt="Welcome" style="width:48px;height:48px;vertical-align:middle;" />`,

  order: `<img src="data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
    <rect x="6" y="10" width="36" height="32" rx="4" fill="#0C332C"/>
    <rect x="10" y="6" width="28" height="8" rx="2" fill="#1A1A1A"/>
    <path d="M16 22H32M16 30H28" stroke="white" stroke-width="2" stroke-linecap="round"/>
    <circle cx="36" cy="36" r="8" fill="#10B981"/>
    <path d="M32 36L35 39L40 34" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`).toString('base64')}" alt="Order" style="width:48px;height:48px;vertical-align:middle;" />`,

  shipping: `<img src="data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
    <rect x="4" y="14" width="28" height="20" rx="2" fill="#3B82F6"/>
    <path d="M32 18H40L44 26V34H32V18Z" fill="#1E40AF"/>
    <circle cx="14" cy="38" r="4" fill="#1A1A1A"/>
    <circle cx="38" cy="38" r="4" fill="#1A1A1A"/>
    <circle cx="14" cy="38" r="2" fill="white"/>
    <circle cx="38" cy="38" r="2" fill="white"/>
  </svg>`).toString('base64')}" alt="Shipping" style="width:48px;height:48px;vertical-align:middle;" />`,

  gift: `<img src="data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
    <rect x="6" y="18" width="36" height="26" rx="4" fill="#0C332C"/>
    <rect x="6" y="12" width="36" height="10" rx="2" fill="#E64A2A"/>
    <rect x="21" y="12" width="6" height="32" fill="#FCD34D"/>
    <path d="M24 12C24 12 18 6 14 10C10 14 16 18 24 12Z" fill="#FCD34D"/>
    <path d="M24 12C24 12 30 6 34 10C38 14 32 18 24 12Z" fill="#FCD34D"/>
  </svg>`).toString('base64')}" alt="Gift" style="width:48px;height:48px;vertical-align:middle;" />`,

  bell: `<img src="data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
    <path d="M24 6C17.373 6 12 11.373 12 18V28L8 34H40L36 28V18C36 11.373 30.627 6 24 6Z" fill="#0C332C"/>
    <path d="M20 38C20 40.209 21.791 42 24 42C26.209 42 28 40.209 28 38" stroke="#0C332C" stroke-width="3"/>
    <circle cx="36" cy="12" r="6" fill="#0C332C"/>
  </svg>`).toString('base64')}" alt="Notification" style="width:48px;height:48px;vertical-align:middle;" />`,

  clock: `<img src="data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
    <circle cx="24" cy="24" r="22" fill="#F59E0B"/>
    <circle cx="24" cy="24" r="18" stroke="white" stroke-width="2"/>
    <path d="M24 12V24L32 28" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`).toString('base64')}" alt="Clock" style="width:48px;height:48px;vertical-align:middle;" />`,

  email: `<img src="data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
    <rect x="4" y="10" width="40" height="28" rx="4" fill="#3B82F6"/>
    <path d="M4 14L24 26L44 14" stroke="white" stroke-width="3" stroke-linejoin="round"/>
  </svg>`).toString('base64')}" alt="Email" style="width:48px;height:48px;vertical-align:middle;" />`,

  verify: `<img src="data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
    <path d="M24 4L42 12V22C42 32.493 34.326 41.879 24 44C13.674 41.879 6 32.493 6 22V12L24 4Z" fill="#10B981"/>
    <path d="M16 24L22 30L32 20" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`).toString('base64')}" alt="Verify" style="width:48px;height:48px;vertical-align:middle;" />`,

  book: `<img src="data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
    <path d="M8 8C8 8 14 6 24 6C34 6 40 8 40 8V40C40 40 34 38 24 38C14 38 8 40 8 40V8Z" fill="#3B82F6"/>
    <path d="M24 6V38" stroke="white" stroke-width="2"/>
    <path d="M14 16H20M28 16H34M14 24H20M28 24H34" stroke="white" stroke-width="2" stroke-linecap="round"/>
  </svg>`).toString('base64')}" alt="Book" style="width:48px;height:48px;vertical-align:middle;" />`,

  video: `<img src="data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
    <rect x="4" y="10" width="30" height="28" rx="4" fill="#6366F1"/>
    <path d="M34 20L44 14V34L34 28V20Z" fill="#6366F1"/>
    <circle cx="19" cy="24" r="8" stroke="white" stroke-width="2"/>
    <path d="M17 22L22 24L17 26V22Z" fill="white"/>
  </svg>`).toString('base64')}" alt="Video" style="width:48px;height:48px;vertical-align:middle;" />`,

  money: `<img src="data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
    <circle cx="24" cy="24" r="22" fill="#10B981"/>
    <path d="M24 12V36M18 20C18 17.791 20.686 16 24 16C27.314 16 30 17.791 30 20C30 22.209 27.314 24 24 24C20.686 24 18 25.791 18 28C18 30.209 20.686 32 24 32C27.314 32 30 30.209 30 28" stroke="white" stroke-width="3" stroke-linecap="round"/>
  </svg>`).toString('base64')}" alt="Money" style="width:48px;height:48px;vertical-align:middle;" />`,

  star: `<img src="data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
    <path d="M24 4L29.5 17.5L44 19L33 29L36 44L24 37L12 44L15 29L4 19L18.5 17.5L24 4Z" fill="#FCD34D"/>
  </svg>`).toString('base64')}" alt="Star" style="width:48px;height:48px;vertical-align:middle;" />`,

  heart: `<img src="data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
    <path d="M24 42C24 42 6 30 6 18C6 12 10.477 6 17 6C21.5 6 24 10 24 10C24 10 26.5 6 31 6C37.523 6 42 12 42 18C42 30 24 42 24 42Z" fill="#0C332C"/>
  </svg>`).toString('base64')}" alt="Heart" style="width:48px;height:48px;vertical-align:middle;" />`,

  lightbulb: `<img src="data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
    <path d="M24 4C16.268 4 10 10.268 10 18C10 23.5 14 28 18 32V36H30V32C34 28 38 23.5 38 18C38 10.268 31.732 4 24 4Z" fill="#FCD34D"/>
    <rect x="18" y="38" width="12" height="6" rx="2" fill="#1A1A1A"/>
    <path d="M20 42H28" stroke="#FCD34D" stroke-width="2" stroke-linecap="round"/>
    <path d="M24 12V22M20 18H28" stroke="white" stroke-width="2" stroke-linecap="round"/>
  </svg>`).toString('base64')}" alt="Tip" style="width:48px;height:48px;vertical-align:middle;" />`,

  download: `<img src="data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
    <rect x="6" y="6" width="36" height="36" rx="6" fill="#3B82F6"/>
    <path d="M24 14V30M24 30L18 24M24 30L30 24" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M14 36H34" stroke="white" stroke-width="3" stroke-linecap="round"/>
  </svg>`).toString('base64')}" alt="Download" style="width:48px;height:48px;vertical-align:middle;" />`,

  teacher: `<img src="data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
    <circle cx="24" cy="14" r="10" fill="#3B82F6"/>
    <path d="M8 44C8 32.954 14.954 26 26 26H22C33.046 26 40 32.954 40 44" stroke="#3B82F6" stroke-width="4" stroke-linecap="round"/>
    <rect x="30" y="4" width="14" height="12" rx="2" fill="#10B981"/>
    <path d="M37 7V13M34 10H40" stroke="white" stroke-width="2" stroke-linecap="round"/>
  </svg>`).toString('base64')}" alt="Teacher" style="width:48px;height:48px;vertical-align:middle;" />`,

  student: `<img src="data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
    <path d="M24 4L4 14L24 24L44 14L24 4Z" fill="#6366F1"/>
    <path d="M10 18V32C10 32 16 38 24 38C32 38 38 32 38 32V18" stroke="#6366F1" stroke-width="3"/>
    <path d="M42 14V28" stroke="#6366F1" stroke-width="3" stroke-linecap="round"/>
    <circle cx="42" cy="32" r="3" fill="#FCD34D"/>
  </svg>`).toString('base64')}" alt="Student" style="width:48px;height:48px;vertical-align:middle;" />`,

  freelancer: `<img src="data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
    <rect x="6" y="10" width="36" height="28" rx="4" fill="#8B5CF6"/>
    <path d="M14 18L22 26L14 34" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M26 30H34" stroke="white" stroke-width="3" stroke-linecap="round"/>
  </svg>`).toString('base64')}" alt="Freelancer" style="width:48px;height:48px;vertical-align:middle;" />`,

  rocket: `<img src="data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
    <path d="M24 4C24 4 16 12 16 26C16 34 20 40 24 44C28 40 32 34 32 26C32 12 24 4 24 4Z" fill="#0C332C"/>
    <circle cx="24" cy="22" r="4" fill="white"/>
    <path d="M16 30C12 32 8 30 8 30C8 30 10 26 14 24" fill="#FCD34D"/>
    <path d="M32 30C36 32 40 30 40 30C40 30 38 26 34 24" fill="#FCD34D"/>
    <path d="M20 44L24 38L28 44" fill="#FCD34D"/>
  </svg>`).toString('base64')}" alt="Launch" style="width:48px;height:48px;vertical-align:middle;" />`,

  list: `<img src="data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
    <rect x="6" y="6" width="36" height="36" rx="4" fill="#F3F4F6"/>
    <circle cx="14" cy="16" r="3" fill="#10B981"/>
    <circle cx="14" cy="24" r="3" fill="#10B981"/>
    <circle cx="14" cy="32" r="3" fill="#10B981"/>
    <path d="M22 16H38M22 24H38M22 32H32" stroke="#374151" stroke-width="2" stroke-linecap="round"/>
  </svg>`).toString('base64')}" alt="List" style="width:48px;height:48px;vertical-align:middle;" />`,

  palette: `<img src="data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
    <path d="M24 4C12.954 4 4 12.954 4 24C4 35.046 12.954 44 24 44C25.657 44 27 42.657 27 41C27 40.209 26.679 39.497 26.167 38.985C25.666 38.484 25.357 37.787 25.357 37C25.357 35.343 26.7 34 28.357 34H32C38.627 34 44 28.627 44 22C44 11.507 35.046 4 24 4Z" fill="#E5E7EB"/>
    <circle cx="16" cy="18" r="4" fill="#0C332C"/>
    <circle cx="24" cy="12" r="4" fill="#FCD34D"/>
    <circle cx="32" cy="18" r="4" fill="#10B981"/>
    <circle cx="14" cy="28" r="4" fill="#3B82F6"/>
  </svg>`).toString('base64')}" alt="Design" style="width:48px;height:48px;vertical-align:middle;" />`,

  attachment: `<img src="data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
    <path d="M38 22L24 36C20.134 39.866 13.866 39.866 10 36C6.134 32.134 6.134 25.866 10 22L22 10C24.485 7.515 28.515 7.515 31 10C33.485 12.485 33.485 16.515 31 19L19 31C17.895 32.105 16.105 32.105 15 31C13.895 29.895 13.895 28.105 15 27L27 15" stroke="#6366F1" stroke-width="4" stroke-linecap="round"/>
  </svg>`).toString('base64')}" alt="Attachment" style="width:48px;height:48px;vertical-align:middle;" />`,

  certificate: `<img src="data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
    <rect x="6" y="8" width="36" height="28" rx="4" fill="#FCD34D" stroke="#1A1A1A" stroke-width="2"/>
    <path d="M16 18H32M16 24H28" stroke="#1A1A1A" stroke-width="2" stroke-linecap="round"/>
    <circle cx="36" cy="36" r="10" fill="#10B981"/>
    <path d="M32 36L35 39L40 34" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`).toString('base64')}" alt="Certificate" style="width:48px;height:48px;vertical-align:middle;" />`,

  wave: `<img src="data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
    <path d="M10 26C10 26 10 14 18 14C26 14 24 26 24 26C24 26 24 14 32 14C40 14 38 26 38 26" fill="#FCD34D"/>
    <path d="M8 32C8 32 12 28 16 32C20 36 24 28 28 32C32 36 36 28 40 32" stroke="#3B82F6" stroke-width="3" stroke-linecap="round"/>
    <circle cx="14" cy="20" r="2" fill="#1A1A1A"/>
    <circle cx="34" cy="20" r="2" fill="#1A1A1A"/>
    <path d="M20 22C20 22 22 24 24 24C26 24 28 22 28 22" stroke="#1A1A1A" stroke-width="2" stroke-linecap="round"/>
  </svg>`).toString('base64')}" alt="Hello" style="width:48px;height:48px;vertical-align:middle;" />`,

  target: `<img src="data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
    <circle cx="24" cy="24" r="20" stroke="#0C332C" stroke-width="4"/>
    <circle cx="24" cy="24" r="12" stroke="#F59E0B" stroke-width="4"/>
    <circle cx="24" cy="24" r="4" fill="#10B981"/>
  </svg>`).toString('base64')}" alt="Target" style="width:48px;height:48px;vertical-align:middle;" />`,

  calendar: `<img src="data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
    <rect x="6" y="10" width="36" height="32" rx="4" fill="#3B82F6"/>
    <rect x="6" y="10" width="36" height="10" fill="#1E40AF"/>
    <path d="M14 6V14M34 6V14" stroke="#1A1A1A" stroke-width="3" stroke-linecap="round"/>
    <rect x="12" y="26" width="6" height="6" rx="1" fill="white"/>
    <rect x="21" y="26" width="6" height="6" rx="1" fill="white"/>
    <rect x="30" y="26" width="6" height="6" rx="1" fill="white"/>
  </svg>`).toString('base64')}" alt="Calendar" style="width:48px;height:48px;vertical-align:middle;" />`,

  message: `<img src="data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
    <path d="M6 10C6 7.791 7.791 6 10 6H38C40.209 6 42 7.791 42 10V32C42 34.209 40.209 36 38 36H16L6 44V10Z" fill="#10B981"/>
    <path d="M14 16H34M14 24H28" stroke="white" stroke-width="2" stroke-linecap="round"/>
  </svg>`).toString('base64')}" alt="Message" style="width:48px;height:48px;vertical-align:middle;" />`,
};

export const EMAIL_SENDER_CONFIG = {
  noreply: '"EduFiliova" <noreply@edufiliova.com>',
  support: '"EduFiliova Support" <support@edufiliova.com>',
  orders: '"EduFiliova Orders" <orders@edufiliova.com>',
  verify: '"EduFiliova Verification" <verify@edufiliova.com>',
  design: '"EduFiliova Design" <design@edufiliova.com>',
};

export type EmailType = 
  | 'notification' 
  | 'support' 
  | 'order' 
  | 'verification' 
  | 'marketing' 
  | 'design';

export function getSenderForEmailType(type: EmailType): string {
  switch (type) {
    case 'notification':
      return EMAIL_SENDER_CONFIG.noreply;
    case 'support':
      return EMAIL_SENDER_CONFIG.support;
    case 'order':
      return EMAIL_SENDER_CONFIG.orders;
    case 'verification':
      return EMAIL_SENDER_CONFIG.verify;
    case 'marketing':
      return EMAIL_SENDER_CONFIG.noreply;
    case 'design':
      return EMAIL_SENDER_CONFIG.design;
    default:
      return EMAIL_SENDER_CONFIG.noreply;
  }
}

export function getIconHtml(iconName: keyof typeof EMAIL_ICONS, size: number = 48): string {
  const icon = EMAIL_ICONS[iconName];
  if (!icon) return '';
  return icon.replace(/width="48"/g, `width="${size}"`).replace(/height="48"/g, `height="${size}"`);
}

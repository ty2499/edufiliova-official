import { useMemo } from 'react';
import { useAuth } from './useAuth';
import {
  NavSection,
  NavItem,
  NAV_SECTIONS,
  canAccessNavItem,
  canAccessNavSection,
  canAccessPage,
  getVisibleNavItems,
  PUBLIC_PAGES,
} from '@/lib/navConfig';

export function useNavAccess() {
  const { user, profile } = useAuth();
  const isAuthenticated = !!user;
  const userRole = profile?.role || null;

  const visibleSections = useMemo(() => {
    const sections: Record<string, NavSection & { visibleItems: NavItem[] }> = {};
    
    for (const [key, section] of Object.entries(NAV_SECTIONS)) {
      if (canAccessNavSection(section, isAuthenticated, userRole)) {
        const visibleItems = getVisibleNavItems(section.items, isAuthenticated, userRole);
        if (visibleItems.length > 0) {
          sections[key] = {
            ...section,
            visibleItems,
          };
        }
      }
    }
    
    return sections;
  }, [isAuthenticated, userRole]);

  const canAccess = useMemo(() => {
    return (pageId: string): boolean => {
      return canAccessPage(pageId, isAuthenticated, userRole);
    };
  }, [isAuthenticated, userRole]);

  const canSeeNavItem = useMemo(() => {
    return (item: NavItem): boolean => {
      return canAccessNavItem(item, isAuthenticated, userRole);
    };
  }, [isAuthenticated, userRole]);

  const canSeeSection = useMemo(() => {
    return (sectionId: string): boolean => {
      const section = NAV_SECTIONS[sectionId];
      if (!section) return false;
      return canAccessNavSection(section, isAuthenticated, userRole);
    };
  }, [isAuthenticated, userRole]);

  const isPublicPage = (pageId: string): boolean => {
    return PUBLIC_PAGES.includes(pageId) || 
           pageId.startsWith('course-detail-') || 
           pageId.startsWith('product-detail-') ||
           pageId.startsWith('blog-post-') ||
           pageId.startsWith('freelancer-profile-');
  };

  return {
    isAuthenticated,
    userRole,
    visibleSections,
    canAccess,
    canSeeNavItem,
    canSeeSection,
    isPublicPage,
    sections: NAV_SECTIONS,
  };
}

export default useNavAccess;

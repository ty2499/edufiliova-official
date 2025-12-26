import { Route, Switch, useLocation } from 'wouter';
import { AuthCallback } from '@/pages/AuthCallback';
import { ProfileCompletionForm } from '@/components/ProfileCompletionForm';
import { RoleSelectionDashboard } from '@/components/RoleSelectionDashboard';
import { CheckoutAuth } from '@/pages/CheckoutAuth';

/**
 * Social Authentication Router
 * 
 * This component handles URL-based routing specifically for social authentication flows
 * that require OAuth callback URLs. It works alongside the existing state-based routing
 * system in the main app by intercepting specific routes.
 */
export function SocialAuthRouter() {
  const [location, navigate] = useLocation();

  // Check if current path matches any social auth routes
  const isSocialAuthRoute = location.startsWith('/auth/callback') ||
                           location.startsWith('/profile-completion') ||
                           location.startsWith('/role-selection') ||
                           location.startsWith('/checkout');

  // Only render if we're on a social auth route
  if (!isSocialAuthRoute) {
    return null;
  }

  return (
    <Switch>
      {/* Social Auth Callback - handles OAuth redirects */}
      <Route path="/auth/callback">
        <AuthCallback />
      </Route>

      {/* Profile Completion after social login */}
      <Route path="/profile-completion">
        <ProfileCompletionForm 
          onComplete={() => {
            // Navigate based on checkout status
            const urlParams = new URLSearchParams(window.location.search);
            const isCheckout = urlParams.get('checkout') === 'true';
            
            if (isCheckout) {
              navigate('/checkout/role-selection');
            } else {
              navigate('/role-selection');
            }
          }}
        />
      </Route>

      {/* Role Selection after social login */}
      <Route path="/role-selection">
        <RoleSelectionDashboard />
      </Route>

      {/* Checkout Authentication */}
      <Route path="/checkout/auth">
        <CheckoutAuth 
          onSuccess={() => {
            // Success is handled by the component itself
          }}
        />
      </Route>

      {/* Checkout Role Selection */}
      <Route path="/checkout/role-selection">
        <RoleSelectionDashboard 
          isFromCheckout={true}
        />
      </Route>

      {/* Default fallback - shouldn't reach here but just in case */}
      <Route>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Page Not Found</h2>
            <p className="text-gray-600 mb-4">The page you're looking for doesn't exist.</p>
            <button
              onClick={() => window.location.href = '/'}
              className="bg-primary text-white px-4 py-2 rounded hover:bg-primary transition-all duration-300"
            >
              Go Home
            </button>
          </div>
        </div>
      </Route>
    </Switch>
  );
}

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export type SocialProvider = 'google' | 'twitter' | 'facebook';

interface SocialAuthHook {
  signInWithProvider: (provider: SocialProvider, options?: { redirectTo?: string; isCheckout?: boolean }) => Promise<void>;
  loading: boolean;
  error: string | null;
  isAvailable: boolean;
}

export function useSocialAuth(): SocialAuthHook {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signInWithProvider = async (provider: SocialProvider, options?: { redirectTo?: string; isCheckout?: boolean }) => {
    if (!supabase) {
      setError('Social authentication is not available');
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      const currentUrl = new URL(window.location.origin);
      const redirectTo = options?.redirectTo || '/auth/callback';
      
      const callbackUrl = new URL(redirectTo, currentUrl.origin);
      if (options?.isCheckout) {
        callbackUrl.searchParams.set('checkout', 'true');
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: callbackUrl.toString(),
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) {
        throw error;
      }

      console.log('Social auth initiated:', data);
    } catch (err: any) {
      console.error('Social auth error:', err);
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return {
    signInWithProvider,
    loading,
    error,
    isAvailable: !!supabase
  };
}

// Hook for handling the auth callback after social login
export function useAuthCallback() {
  const [processing, setProcessing] = useState(false);

  const handleAuthCallback = async () => {
    if (!supabase) {
      throw new Error('Social authentication is not configured');
    }
    
    setProcessing(true);
    
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        throw error;
      }

      if (data.session?.user) {
        const user = data.session.user;
        
        const provider = user.app_metadata?.provider || 'email';
        const isCheckout = new URLSearchParams(window.location.search).get('checkout') === 'true';
        
        const response = await fetch('/api/auth/social-callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${data.session.access_token}`,
          },
          body: JSON.stringify({
            provider,
            isCheckout
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to create account');
        }

        return result;
      }
    } catch (err: any) {
      console.error('Auth callback error:', err);
      throw err;
    } finally {
      setProcessing(false);
    }
  };

  return {
    handleAuthCallback,
    processing
  };
}

// Hook for checking if user needs to complete profile or select role
export function useAuthFlow() {
  const { user } = useAuth();
  
  const needsProfileCompletion = user && !user.hasCompletedProfile;
  const needsRoleSelection = user && user.hasCompletedProfile && !user.hasSelectedRole;
  const isAuthenticated = !!user;
  const canAccessDashboard = user && user.hasCompletedProfile && user.hasSelectedRole;

  return {
    needsProfileCompletion,
    needsRoleSelection, 
    isAuthenticated,
    canAccessDashboard,
    user
  };
}

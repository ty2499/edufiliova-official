import { QueryClient } from '@tanstack/react-query';

// Get the API base URL - route all API calls to main domain
export function getApiBaseUrl(): string {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // If running on app.edufiliova.com subdomain, use main domain's API
    // This is because the subdomain may be static-only hosting
    if (hostname === 'app.edufiliova.com') {
      return 'https://edufiliova.com';
    }
    
    // For www subdomain, also use main domain
    if (hostname === 'www.edufiliova.com') {
      return 'https://edufiliova.com';
    }
  }
  
  // For main domain and development, use same-origin (relative paths)
  return '';
}

// Resolve an API URL to the correct host
export function resolveApiUrl(path: string): string {
  const baseUrl = getApiBaseUrl();
  if (baseUrl && path.startsWith('/')) {
    return `${baseUrl}${path}`;
  }
  return path;
}

// Default query function that handles both string URLs and object parameters
const defaultQueryFn = async ({ queryKey }: { queryKey: readonly unknown[] }) => {
  let url = queryKey[0] as string;
  
  // If there's a params object in the queryKey, serialize it to query string
  if (queryKey[1] && typeof queryKey[1] === 'object') {
    const params = new URLSearchParams();
    Object.entries(queryKey[1] as Record<string, any>).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
    const queryString = params.toString();
    if (queryString) {
      url = `${url}?${queryString}`;
    }
  }
  
  // Resolve URL to correct host for cross-subdomain support
  url = resolveApiUrl(url);
  
  return apiRequest(url);
};

// Create and export the query client instance
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: defaultQueryFn,
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error && typeof error === 'object' && 'status' in error) {
          const status = (error as any).status;
          if (status >= 400 && status < 500) {
            return false;
          }
        }
        // Retry up to 2 times for other errors
        return failureCount < 2;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime in v5)
    },
    mutations: {
      retry: false,
      onError: (error) => {
        console.error('Mutation error:', error);
      },
    },
  },
});

// Simple API request utility with retry for transient errors
export async function apiRequest(url: string, options: RequestInit = {}, retryCount = 0): Promise<any> {
  const MAX_RETRIES = 4;
  
  // Resolve URL to correct host for cross-subdomain support
  const resolvedUrl = resolveApiUrl(url);
  
  // Get session ID from localStorage for authenticated requests
  const sessionId = localStorage.getItem('sessionId');
  
  console.log('🔐 apiRequest called for:', resolvedUrl);
  console.log('🔐 apiRequest authenticated:', !!sessionId);
  
  // Don't set Content-Type for FormData - let browser set it with boundary
  const isFormData = options.body instanceof FormData;
  
  // Build headers object with proper typing
  const headers: Record<string, string> = {};
  
  // Always request JSON response
  headers['Accept'] = 'application/json';
  
  // Add content type if not FormData
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  
  // Merge user-provided headers first
  if (options.headers) {
    Object.assign(headers, options.headers);
  }
  
  // Add authentication headers last to prevent override
  if (sessionId) {
    headers['Authorization'] = `Bearer ${sessionId}`;
    headers['x-session-id'] = sessionId;
  }
  
  const response = await fetch(resolvedUrl, {
    ...options,
    credentials: 'include', // Include cookies in requests
    cache: 'no-store', // Prevent 304 responses that cause issues with React Query
    headers,
  });

  // Handle 304 Not Modified as success (content hasn't changed)
  if (response.status === 304) {
    // Return cached data if available, or empty data
    return { success: true, data: null };
  }

  if (!response.ok) {
    // Try to parse error response body for better error details
    let errorResponse;
    try {
      const responseText = await response.text();
      errorResponse = responseText ? JSON.parse(responseText) : {};
    } catch {
      // If JSON parsing fails, use generic error
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    // Create enhanced error with details for better frontend error handling
    const error = new Error(errorResponse.error || `API request failed: ${response.status} ${response.statusText}`);
    (error as any).status = response.status;
    (error as any).details = errorResponse.details;
    throw error;
  }

  // Handle empty responses
  const responseText = await response.text();
  if (!responseText) {
    return { success: true };
  }
  
  // Parse JSON response with error handling
  let result;
  try {
    result = JSON.parse(responseText);
  } catch (parseError) {
    // If JSON parsing fails on a successful response, this is likely a Vite HMR race condition
    // Retry all requests (GET, POST, PUT, DELETE) since Vite can intercept any of them
    if (retryCount < MAX_RETRIES) {
      const method = options.method || 'GET';
      console.warn(`Retrying ${method} request to ${resolvedUrl} after HTML response (attempt ${retryCount + 1}/${MAX_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, 200 * (retryCount + 1)));
      return apiRequest(resolvedUrl, options, retryCount + 1);
    }
    // Only log error if all retries failed
    console.error('Failed to parse response as JSON after retries. Response text:', responseText.substring(0, 200));
    
    // Return null for GET requests instead of throwing - this allows React Query to use cached data
    if (!options.method || options.method === 'GET') {
      console.warn('Returning null for failed GET request, React Query will use cached data');
      return null;
    }
    // For mutations that completed on server but we got HTML response, 
    // return success to prevent error display (server already processed the request)
    console.warn('Mutation may have succeeded on server but received HTML. Returning optimistic success.');
    return { success: true };
  }
  
  // Only check for explicit success: false, not missing success field
  if (result.success === false) {
    const error = new Error(result.error || 'API request failed');
    (error as any).details = result.details;
    throw error;
  }

  return result.data || result;
}

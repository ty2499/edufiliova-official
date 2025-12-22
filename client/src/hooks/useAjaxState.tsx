import { useState, useCallback, useRef } from 'react';

export type AjaxOperation = 'idle' | 'loading' | 'adding' | 'updating' | 'deleting' | 'uploading' | 'downloading' | 'success' | 'error';

interface AjaxState {
  operation: AjaxOperation;
  message?: string;
  error?: string;
}

interface UseAjaxStateReturn {
  operation: AjaxOperation;
  message?: string;
  error?: string;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  setLoading: (message?: string) => void;
  setAdding: (message?: string) => void;
  setUpdating: (message?: string) => void;
  setDeleting: (message?: string) => void;
  setUploading: (message?: string) => void;
  setDownloading: (message?: string) => void;
  setSuccess: (message?: string) => void;
  setError: (message?: string) => void;
  setIdle: () => void;
  executeOperation: <T>(
    operation: 'adding' | 'updating' | 'deleting' | 'uploading' | 'downloading' | 'loading',
    asyncFn: () => Promise<T>,
    options?: {
      successMessage?: string;
      errorMessage?: string;
      onSuccess?: (result: T) => void;
      onError?: (error: any) => void;
      autoReset?: number; // Auto reset to idle after X milliseconds
    }
  ) => Promise<T | null>;
}

export const useAjaxState = (initialState: AjaxState = { operation: 'idle' }): UseAjaxStateReturn => {
  const [state, setState] = useState<AjaxState>(initialState);
  const resetTimeoutRef = useRef<NodeJS.Timeout>();

  const clearResetTimeout = useCallback(() => {
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = undefined;
    }
  }, []);

  const scheduleReset = useCallback((delay: number) => {
    clearResetTimeout();
    resetTimeoutRef.current = setTimeout(() => {
      setState({ operation: 'idle' });
    }, delay);
  }, [clearResetTimeout]);

  const setLoading = useCallback((message?: string) => {
    clearResetTimeout();
    setState({ operation: 'loading', message });
  }, [clearResetTimeout]);

  const setAdding = useCallback((message?: string) => {
    clearResetTimeout();
    setState({ operation: 'adding', message: message || 'Adding...' });
  }, [clearResetTimeout]);

  const setUpdating = useCallback((message?: string) => {
    clearResetTimeout();
    setState({ operation: 'updating', message: message || 'Updating...' });
  }, [clearResetTimeout]);

  const setDeleting = useCallback((message?: string) => {
    clearResetTimeout();
    setState({ operation: 'deleting', message: message || 'Deleting...' });
  }, [clearResetTimeout]);

  const setUploading = useCallback((message?: string) => {
    clearResetTimeout();
    setState({ operation: 'uploading', message: message || 'Uploading...' });
  }, [clearResetTimeout]);

  const setDownloading = useCallback((message?: string) => {
    clearResetTimeout();
    setState({ operation: 'downloading', message: message || 'Downloading...' });
  }, [clearResetTimeout]);

  const setSuccess = useCallback((message?: string) => {
    clearResetTimeout();
    setState({ operation: 'success', message: message || 'Success!' });
  }, [clearResetTimeout]);

  const setError = useCallback((message?: string) => {
    clearResetTimeout();
    setState({ operation: 'error', message: message || 'An error occurred', error: message });
  }, [clearResetTimeout]);

  const setIdle = useCallback(() => {
    clearResetTimeout();
    setState({ operation: 'idle' });
  }, [clearResetTimeout]);

  const executeOperation = useCallback(async <T,>(
    operation: 'adding' | 'updating' | 'deleting' | 'uploading' | 'downloading' | 'loading',
    asyncFn: () => Promise<T>,
    options: {
      successMessage?: string;
      errorMessage?: string;
      onSuccess?: (result: T) => void;
      onError?: (error: any) => void;
      autoReset?: number;
    } = {}
  ): Promise<T | null> => {
    const {
      successMessage,
      errorMessage,
      onSuccess,
      onError,
      autoReset = 2000
    } = options;

    try {
      // Set loading state based on operation
      switch (operation) {
        case 'adding':
          setAdding();
          break;
        case 'updating':
          setUpdating();
          break;
        case 'deleting':
          setDeleting();
          break;
        case 'uploading':
          setUploading();
          break;
        case 'downloading':
          setDownloading();
          break;
        default:
          setLoading();
      }

      const result = await asyncFn();
      
      setSuccess(successMessage);
      onSuccess?.(result);
      
      if (autoReset > 0) {
        scheduleReset(autoReset);
      }
      
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : (errorMessage || 'Operation failed');
      setError(errorMsg);
      onError?.(error);
      
      if (autoReset > 0) {
        scheduleReset(autoReset);
      }
      
      return null;
    }
  }, [setAdding, setUpdating, setDeleting, setUploading, setDownloading, setLoading, setSuccess, setError, scheduleReset]);

  return {
    operation: state.operation,
    message: state.message,
    error: state.error,
    isLoading: ['loading', 'adding', 'updating', 'deleting', 'uploading', 'downloading'].includes(state.operation),
    isSuccess: state.operation === 'success',
    isError: state.operation === 'error',
    setLoading,
    setAdding,
    setUpdating,
    setDeleting,
    setUploading,
    setDownloading,
    setSuccess,
    setError,
    setIdle,
    executeOperation
  };
};

// Multiple AJAX states hook for complex forms/pages
interface UseMultipleAjaxStatesReturn {
  states: Record<string, AjaxState>;
  getState: (key: string) => AjaxState;
  isAnyLoading: boolean;
  executeOperation: <T>(
    key: string,
    operation: 'adding' | 'updating' | 'deleting' | 'uploading' | 'downloading' | 'loading',
    asyncFn: () => Promise<T>,
    options?: {
      successMessage?: string;
      errorMessage?: string;
      onSuccess?: (result: T) => void;
      onError?: (error: any) => void;
      autoReset?: number;
    }
  ) => Promise<T | null>;
  setOperation: (key: string, operation: AjaxOperation, message?: string) => void;
  reset: (key?: string) => void;
}

export const useMultipleAjaxStates = (keys: string[]): UseMultipleAjaxStatesReturn => {
  const [states, setStates] = useState<Record<string, AjaxState>>(() =>
    keys.reduce((acc, key) => ({ ...acc, [key]: { operation: 'idle' } }), {})
  );

  const getState = useCallback((key: string): AjaxState => {
    return states[key] || { operation: 'idle' };
  }, [states]);

  const isAnyLoading = Object.values(states).some(state =>
    ['loading', 'adding', 'updating', 'deleting', 'uploading', 'downloading'].includes(state.operation)
  );

  const setOperation = useCallback((key: string, operation: AjaxOperation, message?: string) => {
    setStates(prev => ({
      ...prev,
      [key]: { operation, message }
    }));
  }, []);

  const executeOperation = useCallback(async <T,>(
    key: string,
    operation: 'adding' | 'updating' | 'deleting' | 'uploading' | 'downloading' | 'loading',
    asyncFn: () => Promise<T>,
    options: {
      successMessage?: string;
      errorMessage?: string;
      onSuccess?: (result: T) => void;
      onError?: (error: any) => void;
      autoReset?: number;
    } = {}
  ): Promise<T | null> => {
    const {
      successMessage,
      errorMessage,
      onSuccess,
      onError,
      autoReset = 2000
    } = options;

    try {
      setOperation(key, operation);
      const result = await asyncFn();
      setOperation(key, 'success', successMessage);
      onSuccess?.(result);
      
      if (autoReset > 0) {
        setTimeout(() => setOperation(key, 'idle'), autoReset);
      }
      
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : (errorMessage || 'Operation failed');
      setOperation(key, 'error', errorMsg);
      onError?.(error);
      
      if (autoReset > 0) {
        setTimeout(() => setOperation(key, 'idle'), autoReset);
      }
      
      return null;
    }
  }, [setOperation]);

  const reset = useCallback((key?: string) => {
    if (key) {
      setOperation(key, 'idle');
    } else {
      setStates(prev => 
        Object.keys(prev).reduce((acc, k) => ({ ...acc, [k]: { operation: 'idle' } }), {})
      );
    }
  }, [setOperation]);

  return {
    states,
    getState,
    isAnyLoading,
    executeOperation,
    setOperation,
    reset
  };
};

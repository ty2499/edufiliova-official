import { useState, useEffect, useCallback, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// Modern loading states enum
export type LoadingState = 'idle' | 'loading' | 'success' | 'error' | 'optimistic'

// Progressive loading hook for large datasets
export function useProgressiveLoading<T>(
  queryKey: string[],
  fetchFn: (page: number, pageSize: number) => Promise<{ data: T[]; hasMore: boolean; total: number }>,
  options: {
    pageSize?: number
    enabled?: boolean
    staleTime?: number
  } = {}
) {
  const { pageSize = 20, enabled = true, staleTime = 5 * 60 * 1000 } = options
  const [currentPage, setCurrentPage] = useState(1)
  const [allData, setAllData] = useState<T[]>([])
  const [hasMore, setHasMore] = useState(true)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [...queryKey, currentPage, pageSize],
    queryFn: () => fetchFn(currentPage, pageSize),
    enabled: enabled && hasMore,
    staleTime,
  })

  useEffect(() => {
    if (data?.data) {
      if (currentPage === 1) {
        setAllData(data.data)
      } else {
        setAllData(prev => [...prev, ...data.data])
      }
      setHasMore(data.hasMore)
    }
  }, [data, currentPage])

  const loadMore = useCallback(() => {
    if (hasMore && !isLoading) {
      setCurrentPage(prev => prev + 1)
    }
  }, [hasMore, isLoading])

  const reset = useCallback(() => {
    setCurrentPage(1)
    setAllData([])
    setHasMore(true)
    refetch()
  }, [refetch])

  return {
    data: allData,
    isLoading,
    error,
    hasMore,
    loadMore,
    reset,
    total: data?.total || 0,
    currentPage,
  }
}

// Optimistic updates hook
export function useOptimisticMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: {
    queryKey: string[]
    optimisticUpdate?: (oldData: any, variables: TVariables) => any
    onSuccess?: (data: TData, variables: TVariables) => void
    onError?: (error: any, variables: TVariables, context: any) => void
  }
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onMutate: async (variables) => {
      if (options.optimisticUpdate) {
        await queryClient.cancelQueries({ queryKey: options.queryKey })
        const previousData = queryClient.getQueryData(options.queryKey)
        
        queryClient.setQueryData(
          options.queryKey,
          (old: any) => options.optimisticUpdate!(old, variables)
        )
        
        return { previousData }
      }
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(options.queryKey, context.previousData)
      }
      options.onError?.(err, variables, context)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: options.queryKey })
    },
    onSuccess: options.onSuccess,
  })
}

// Real-time loading with WebSocket support
export function useRealTimeData<T>(
  queryKey: string[],
  fetchFn: () => Promise<T>,
  wsUrl?: string,
  options: {
    refetchInterval?: number
    enabled?: boolean
  } = {}
) {
  const { refetchInterval = 30000, enabled = true } = options
  const wsRef = useRef<WebSocket | null>(null)
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey,
    queryFn: fetchFn,
    enabled,
    refetchInterval,
    staleTime: 1000,
  })

  useEffect(() => {
    if (wsUrl && enabled) {
      wsRef.current = new WebSocket(wsUrl)
      
      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          queryClient.setQueryData(queryKey, data)
        } catch (error) {
          console.error('WebSocket message parsing error:', error)
        }
      }

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error)
      }

      return () => {
        if (wsRef.current) {
          wsRef.current.close()
        }
      }
    }
  }, [wsUrl, enabled, queryKey, queryClient])

  return query
}

// Smart retry hook with exponential backoff
export function useSmartRetry<T>(
  queryKey: string[],
  fetchFn: () => Promise<T>,
  options: {
    maxRetries?: number
    retryDelay?: number
    enabled?: boolean
  } = {}
) {
  const { maxRetries = 3, retryDelay = 1000, enabled = true } = options
  const [retryCount, setRetryCount] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)

  const query = useQuery({
    queryKey,
    queryFn: fetchFn,
    enabled,
    retry: false, // We handle retries manually
  })

  const manualRetry = useCallback(async () => {
    if (retryCount >= maxRetries || isRetrying) return

    setIsRetrying(true)
    const delay = retryDelay * Math.pow(2, retryCount) // Exponential backoff
    
    await new Promise(resolve => setTimeout(resolve, delay))
    
    setRetryCount(prev => prev + 1)
    query.refetch()
    setIsRetrying(false)
  }, [retryCount, maxRetries, isRetrying, retryDelay, query])

  useEffect(() => {
    if (query.error && retryCount < maxRetries && !isRetrying) {
      manualRetry()
    }
  }, [query.error, retryCount, maxRetries, isRetrying, manualRetry])

  const reset = useCallback(() => {
    setRetryCount(0)
    setIsRetrying(false)
  }, [])

  return {
    ...query,
    retryCount,
    isRetrying,
    canRetry: retryCount < maxRetries,
    manualRetry,
    reset,
  }
}

// Loading state manager
export function useLoadingStates() {
  const [states, setStates] = useState<Record<string, LoadingState>>({})

  const setLoadingState = useCallback((key: string, state: LoadingState) => {
    setStates(prev => ({ ...prev, [key]: state }))
  }, [])

  const getLoadingState = useCallback((key: string): LoadingState => {
    return states[key] || 'idle'
  }, [states])

  const isLoading = useCallback((keys?: string[]): boolean => {
    if (keys) {
      return keys.some(key => states[key] === 'loading')
    }
    return Object.values(states).some(state => state === 'loading')
  }, [states])

  const clearState = useCallback((key: string) => {
    setStates(prev => {
      const newStates = { ...prev }
      delete newStates[key]
      return newStates
    })
  }, [])

  return {
    states,
    setLoadingState,
    getLoadingState,
    isLoading,
    clearState,
  }
}

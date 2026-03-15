import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from '../../shared/api/queryClient'

/**
 * 앱 전역 Provider 조합
 * 새 Provider 추가 시 여기에만 추가하면 된다
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* 개발 환경에서만 React Query DevTools 표시 */}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  )
}

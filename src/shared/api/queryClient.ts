import { QueryClient } from '@tanstack/react-query'

/**
 * React Query 전역 클라이언트 설정
 * - staleTime: 30초 (서버 데이터를 30초간 신선하다고 간주 → 불필요한 재요청 방지)
 * - retry: 1회 (네트워크 오류 시 1번 재시도)
 * - refetchOnWindowFocus: false (탭 전환 시 자동 재요청 비활성화)
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

/** React Query 쿼리 키 팩토리 — 일관된 키 관리 및 무효화에 사용 */
export const queryKeys = {
  userTables: {
    all: () => ['user-tables'] as const,
    detail: (id: number) => ['user-tables', id] as const,
  },
  columns: {
    byTable: (tableId: number) => ['columns', tableId] as const,
  },
  inventoryItems: {
    byTable: (tableId: number) => ['inventory-items', tableId] as const,
  },
  contractors: {
    all: () => ['contractors'] as const,
    detail: (id: number) => ['contractors', id] as const,
  },
  sites: {
    byContractor: (contractorId: number) => ['sites', contractorId] as const,
    all: () => ['sites'] as const,
  },
  inbound: {
    all: () => ['inbound'] as const,
    byPart: (partId: number) => ['inbound', 'part', partId] as const,
  },
  outbound: {
    all: () => ['outbound'] as const,
    byContractor: (contractorId: number) => ['outbound', 'contractor', contractorId] as const,
    bySite: (siteId: number) => ['outbound', 'site', siteId] as const,
  },
  stock: {
    all: () => ['stock'] as const,
    detail: (partId: number) => ['stock', partId] as const,
    /** GET /api/stock/summary — PARTS 테이블 전체 재고 현황 */
    summary: () => ['stock', 'summary'] as const,
  },
  projects: {
    all: () => ['projects'] as const,
    detail: (id: number) => ['projects', id] as const,
  },
}

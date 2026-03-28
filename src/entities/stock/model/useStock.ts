import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../../../shared/api/queryClient'
import { stockApi } from '../api/stockApi'

/** PARTS 테이블 전체 재고 현황 조회 */
export function useStockSummary() {
  return useQuery({
    queryKey: queryKeys.stock.summary(),
    queryFn: stockApi.summary,
  })
}

/**
 * 입고 등록 뮤테이션
 * 성공 시 stock.summary 쿼리를 무효화해 재고 현황을 최신화한다
 */
export function useInbound() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: number; quantity: number }) =>
      stockApi.inbound(itemId, quantity),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.stock.summary() })
    },
  })
}

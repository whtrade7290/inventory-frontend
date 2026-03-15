import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../../../shared/api/queryClient'
import { columnApi } from '../api/columnApi'
import type { CreateColumnDto } from './types'

/** 테이블의 컬럼 목록 조회 */
export function useColumns(tableId: number) {
  return useQuery({
    queryKey: queryKeys.columns.byTable(tableId),
    queryFn: () => columnApi.getByTable(tableId),
    enabled: tableId > 0,
  })
}

/** 컬럼 추가 */
export function useCreateColumn(tableId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateColumnDto) => columnApi.create(tableId, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.columns.byTable(tableId) }),
  })
}

/** 컬럼 이름 변경 */
export function useRenameColumn(tableId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ columnId, name }: { columnId: number; name: string }) =>
      columnApi.rename(tableId, columnId, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.columns.byTable(tableId) }),
  })
}

/** 컬럼 순서 일괄 변경 */
export function useReorderColumns(tableId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (orderMap: Record<number, number>) => columnApi.reorder(tableId, orderMap),
    // 낙관적 업데이트: 서버 응답 전에 캐시를 즉시 갱신해 UI 반응성을 높인다
    onMutate: async (orderMap) => {
      await qc.cancelQueries({ queryKey: queryKeys.columns.byTable(tableId) })
      const previous = qc.getQueryData(queryKeys.columns.byTable(tableId))
      qc.setQueryData(queryKeys.columns.byTable(tableId), (old: import('./types').Column[] | undefined) => {
        if (!old) return old
        return [...old]
          .map((col) => ({ ...col, colOrder: orderMap[col.id] ?? col.colOrder }))
          .sort((a, b) => a.colOrder - b.colOrder)
      })
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      // 실패 시 이전 캐시로 롤백
      if (ctx?.previous) qc.setQueryData(queryKeys.columns.byTable(tableId), ctx.previous)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.columns.byTable(tableId) }),
  })
}

/** 컬럼 삭제 */
export function useDeleteColumn(tableId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (columnId: number) => columnApi.delete(tableId, columnId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.columns.byTable(tableId) })
      // 컬럼 삭제 시 아이템 데이터도 변경됨
      qc.invalidateQueries({ queryKey: queryKeys.inventoryItems.byTable(tableId) })
    },
  })
}

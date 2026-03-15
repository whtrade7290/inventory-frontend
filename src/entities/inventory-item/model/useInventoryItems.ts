import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../../../shared/api/queryClient'
import { inventoryItemApi } from '../api/inventoryItemApi'
import type { ItemValuesDto } from './types'

/** 테이블의 아이템 목록 조회 */
export function useInventoryItems(tableId: number) {
  return useQuery({
    queryKey: queryKeys.inventoryItems.byTable(tableId),
    queryFn: () => inventoryItemApi.getByTable(tableId),
    enabled: tableId > 0,
  })
}

/** 아이템 추가 */
export function useCreateInventoryItem(tableId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: ItemValuesDto) => inventoryItemApi.create(tableId, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.inventoryItems.byTable(tableId) }),
  })
}

/** 아이템 수정 (셀 인라인 편집) */
export function useUpdateInventoryItem(tableId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ itemId, dto }: { itemId: number; dto: ItemValuesDto }) =>
      inventoryItemApi.update(tableId, itemId, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.inventoryItems.byTable(tableId) }),
  })
}

/** 아이템 삭제 */
export function useDeleteInventoryItem(tableId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (itemId: number) => inventoryItemApi.delete(tableId, itemId),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.inventoryItems.byTable(tableId) }),
  })
}

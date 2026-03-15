import client from '../../../shared/api/client'
import type { InventoryItem, ItemValuesDto } from '../model/types'

export const inventoryItemApi = {
  getByTable: (tableId: number) =>
    client.get<InventoryItem[]>(`/tables/${tableId}/items`).then((r) => r.data),

  /** 아이템 생성 — 빈 행은 { values: {} } 전달 */
  create: (tableId: number, dto: ItemValuesDto) =>
    client.post<InventoryItem>(`/tables/${tableId}/items`, dto).then((r) => r.data),

  /** 아이템 수정 — 전체 값 교체 */
  update: (tableId: number, itemId: number, dto: ItemValuesDto) =>
    client.put<InventoryItem>(`/tables/${tableId}/items/${itemId}`, dto).then((r) => r.data),

  delete: (tableId: number, itemId: number) =>
    client.delete(`/tables/${tableId}/items/${itemId}`),
}

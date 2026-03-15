import client from '../../../shared/api/client'
import type { Column, CreateColumnDto } from '../model/types'

export const columnApi = {
  getByTable: (tableId: number) =>
    client.get<Column[]>(`/tables/${tableId}/columns`).then((r) => r.data),

  create: (tableId: number, dto: CreateColumnDto) =>
    client.post<Column>(`/tables/${tableId}/columns`, dto).then((r) => r.data),

  delete: (tableId: number, columnId: number) =>
    client.delete(`/tables/${tableId}/columns/${columnId}`),

  /** 컬럼 이름 변경 */
  rename: (tableId: number, columnId: number, name: string) =>
    client.patch<Column>(`/tables/${tableId}/columns/${columnId}`, { name }).then((r) => r.data),

  /** 컬럼 순서 일괄 변경 — { columnId: newOrder } 맵 전달 */
  reorder: (tableId: number, orderMap: Record<number, number>) =>
    client.patch<Column[]>(`/tables/${tableId}/columns/reorder`, orderMap).then((r) => r.data),
}

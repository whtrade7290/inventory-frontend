import client from '../../../shared/api/client'
import type { StockSummaryItem } from '../model/types'

export const stockApi = {
  /** PARTS 테이블 부품별 현재 재고 수량 조회 */
  summary: () =>
    client.get<StockSummaryItem[]>('/stock/summary').then((r) => r.data),

  /**
   * 입고 등록 — 지정 아이템의 재고 수량을 증가시킨다
   * @param itemId 입고할 inventory_item ID
   * @param quantity 입고 수량 (1 이상)
   */
  inbound: (itemId: number, quantity: number) =>
    client.post('/stock/inbound', { itemId, quantity }).then((r) => r.data),
}

/** 재고 현황 (부품별 집계) */
export interface StockStatus {
  partId: number
  partName: string
  /** 현재 재고 = 누적 입고 - 누적 출고 */
  currentQuantity: number
  /** 최소 수량 (이하 시 경고) */
  minQuantity: number
  /** 재고 부족 여부 */
  isLow: boolean
  totalInbound: number
  totalOutbound: number
}

/** 부품별 입출고 이력 */
export interface StockHistory {
  date: string
  type: 'INBOUND' | 'OUTBOUND'
  quantity: number
  counterpart: string
  note?: string
}

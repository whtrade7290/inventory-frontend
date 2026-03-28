/**
 * GET /api/stock/summary 응답 항목
 * PARTS role 테이블의 inventory_item별 현재 재고 수량과 셀 값 목록
 */
export interface StockSummaryItem {
  inventoryItemId: number
  tableId: number
  tableName: string
  /** 실제 재고 기준값 — 입고 시 증가, BOM 등록 시 차감 */
  stockQuantity: number
  /** 부품 속성 값 목록 — 첫 번째 값이 부품명으로 사용되는 경우가 많다 */
  values: Array<{
    columnId: number
    columnName: string
    value: string
  }>
}

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

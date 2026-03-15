/** 셀 값 */
export interface ItemValue {
  columnId: number
  columnName: string
  dataType: string
  /** 저장된 원본 값 (RELATION이면 참조 아이템 ID) */
  value: string
  /** 표시용 값 (RELATION이면 참조된 실제 값) */
  displayValue?: string
}

/** 재고 아이템 (행) */
export interface InventoryItem {
  id: number
  tableId: number
  values: ItemValue[]
  createdAt: string
  updatedAt: string
}

/**
 * 아이템 생성/수정 요청
 * 백엔드 ItemRequest(Map<Long, String> values)에 맞게 Record 형태로 전달한다
 * 빈 행 생성 시 {} 전달
 */
export interface ItemValuesDto {
  values: Record<number, string>
}

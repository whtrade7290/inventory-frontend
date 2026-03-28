/** BOM 아이템의 부품 셀 값 (상세 조회 시 포함) */
export interface BomCellValue {
  columnId: number
  columnName: string
  value: string
}

/** BOM 아이템 */
export interface BomItemResult {
  id: number
  inventoryItemId: number
  quantity: number
  /** 목록 조회 시 빈 배열, 상세 조회 시 부품 셀 값 포함 */
  values: BomCellValue[]
}

/** 프로젝트 (현장) */
export interface Project {
  id: number
  name: string
  contractor: string | null
  date: string | null
  createdAt: string
  bomItems: BomItemResult[]
}

/** 프로젝트 등록 요청 */
export interface CreateProjectDto {
  name: string
  contractor: string | null
  date: string | null
  bomItems: { inventoryItemId: number; quantity: number }[]
}

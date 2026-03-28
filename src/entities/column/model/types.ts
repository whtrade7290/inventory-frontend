/** 컬럼 데이터 타입 */
export type DataType = 'TEXT' | 'NUMBER' | 'DATE' | 'BOOLEAN' | 'RELATION'

/** 컬럼 정의 */
export interface Column {
  id: number
  tableId: number
  name: string
  dataType: DataType
  colOrder: number
  /** RELATION 타입일 때 참조 테이블 ID */
  refTableId?: number
  /** RELATION 타입일 때 표시할 컬럼 ID */
  refColumnId?: number
  /** 시스템 컬럼 여부 — true이면 삭제/수정 불가 (예: ID 컬럼) */
  isSystem: boolean
  createdAt: string
}

export interface CreateColumnDto {
  name: string
  dataType: DataType
  refTableId?: number
  refColumnId?: number
}

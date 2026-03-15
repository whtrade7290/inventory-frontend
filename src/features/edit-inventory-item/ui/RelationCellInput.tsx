import { useInventoryItems } from '../../../entities/inventory-item'

interface RelationCellInputProps {
  /** 참조 대상 테이블 ID */
  refTableId: number
  /** 드롭다운에 표시할 컬럼 ID */
  refColumnId: number
  /** 현재 선택된 참조 아이템 ID (문자열) */
  value: string
  onChange: (value: string) => void
  onCommit: () => void
  onCancel: () => void
}

/**
 * RELATION 타입 셀 편집 컴포넌트
 * 참조 테이블의 아이템 목록을 드롭다운으로 표시한다
 * React Query 캐싱 덕분에 같은 refTableId를 가진 여러 셀이 있어도 API 요청은 1번만 발생한다
 */
export function RelationCellInput({
  refTableId,
  refColumnId,
  value,
  onChange,
  onCommit,
  onCancel,
}: RelationCellInputProps) {
  const { data: refItems = [], isLoading } = useInventoryItems(refTableId)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); onCommit() }
    if (e.key === 'Escape') { e.preventDefault(); onCancel() }
  }

  return (
    <select
      autoFocus
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={onCommit}
      disabled={isLoading}
      className="w-full h-full px-2 py-1.5 text-sm outline-none border-0 bg-transparent"
    >
      <option value="">— 선택 —</option>
      {refItems.map((item) => {
        /* 표시 컬럼(refColumnId)의 값을 라벨로 사용, 없으면 ID로 대체 */
        const cell = item.values.find((v) => v.columnId === refColumnId)
        const label = cell?.value ?? `ID: ${item.id}`
        return (
          <option key={item.id} value={String(item.id)}>
            {label}
          </option>
        )
      })}
    </select>
  )
}

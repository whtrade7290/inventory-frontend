import type { Column } from '../../../entities/column'
import { RelationCellInput } from './RelationCellInput'

interface GridCellProps {
  column: Column
  value: string
  displayValue?: string
  isEditing: boolean
  editValue: string
  /** 미저장 변경이 있을 때 true — 약간 어두운 배경으로 표시 */
  isDirty?: boolean
  onActivate: () => void
  onChange: (value: string) => void
  onCommit: () => void
  onCancel: () => void
  onTabNext: () => void
}

/**
 * 개별 셀 컴포넌트 (feature: edit-inventory-item)
 * - 표시 모드: 타입별 값 렌더링
 * - 편집 모드: 타입별 input (RELATION은 읽기 전용)
 */
export function GridCell({
  column, value, displayValue, isEditing, editValue, isDirty,
  onActivate, onChange, onCommit, onCancel, onTabNext,
}: GridCellProps) {
  const inputClass = 'w-full h-full px-2 py-1.5 text-sm outline-none border-0 bg-transparent'

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); onCommit() }
    if (e.key === 'Tab')   { e.preventDefault(); onCommit(); onTabNext() }
    if (e.key === 'Escape') { e.preventDefault(); onCancel() }
  }

  const renderInput = () => {
    /* RELATION: refTableId/refColumnId가 있으면 드롭다운, 없으면 읽기 전용 */
    if (column.dataType === 'RELATION') {
      if (column.refTableId && column.refColumnId) {
        return (
          <RelationCellInput
            refTableId={column.refTableId}
            refColumnId={column.refColumnId}
            value={editValue}
            onChange={onChange}
            onCommit={onCommit}
            onCancel={onCancel}
          />
        )
      }
      return renderDisplay()
    }
    if (column.dataType === 'BOOLEAN') {
      return (
        <select autoFocus value={editValue} onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown} onBlur={onCommit} className={inputClass}>
          <option value="">선택</option>
          <option value="true">참</option>
          <option value="false">거짓</option>
        </select>
      )
    }
    return (
      <input autoFocus
        type={column.dataType === 'NUMBER' ? 'number' : column.dataType === 'DATE' ? 'date' : 'text'}
        value={editValue} onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown} onBlur={onCommit} className={inputClass}
      />
    )
  }

  const renderDisplay = () => {
    const display = displayValue ?? value ?? ''
    if (column.dataType === 'BOOLEAN') {
      return (
        <span className={`inline-block w-4 h-4 rounded border-2 ${display === 'true' ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
          {display === 'true' && (
            <svg viewBox="0 0 12 12" className="text-white w-full h-full p-0.5">
              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
            </svg>
          )}
        </span>
      )
    }
    return <span className="truncate text-gray-800">{display}</span>
  }

  return (
    <td onClick={onActivate}
      className={`border-b border-r border-[#e0e0e0] h-8 p-0 cursor-default
        ${isEditing ? 'ring-2 ring-blue-500 ring-inset relative z-10' : ''}
        ${isDirty && !isEditing ? 'bg-amber-50' : ''}`}
    >
      {isEditing
        ? renderInput()
        : <div className="flex items-center h-full px-2">{renderDisplay()}</div>
      }
    </td>
  )
}

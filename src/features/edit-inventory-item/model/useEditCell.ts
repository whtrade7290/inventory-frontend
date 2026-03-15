import { useState } from 'react'
import type { Column } from '../../../entities/column'
import type { InventoryItem } from '../../../entities/inventory-item'

export interface EditingCell {
  itemId: number
  columnId: number
  value: string
}

/**
 * 셀 인라인 편집 상태 관리 훅
 * 커밋 시 서버에 직접 저장하지 않고 onCommit 콜백으로 상위에 전달한다
 * 상위에서 dirty state를 관리하고 저장 버튼 클릭 시 일괄 반영한다
 */
export function useEditCell(
  columns: Column[],
  items: InventoryItem[],
  onCommit: (itemId: number, allValues: Record<number, string>) => void,
) {
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null)

  /** 셀 활성화: 이전 편집을 커밋하고 새 셀 편집 시작 */
  const activate = (itemId: number, columnId: number, currentValue: string) => {
    if (editingCell?.itemId === itemId && editingCell?.columnId === columnId) return
    if (editingCell) commit()
    setEditingCell({ itemId, columnId, value: currentValue })
  }

  /** 편집 값 변경 */
  const change = (value: string) => {
    setEditingCell((prev) => prev ? { ...prev, value } : null)
  }

  /**
   * 편집 커밋: 현재 아이템의 모든 셀 값(dirty overlay 포함) + 변경된 셀 값을 병합해 상위 콜백 호출
   * items는 상위에서 이미 dirty overlay된 displayItems를 전달받으므로 이전 변경도 보존된다
   */
  const commit = () => {
    if (!editingCell) return
    const item = items.find((i) => i.id === editingCell.itemId)
    if (!item) { setEditingCell(null); return }

    const allValues: Record<number, string> = {}
    item.values.forEach((v) => { allValues[v.columnId] = v.value ?? '' })
    allValues[editingCell.columnId] = editingCell.value

    setEditingCell(null)
    onCommit(editingCell.itemId, allValues)
  }

  /** 편집 취소 */
  const cancel = () => setEditingCell(null)

  /** Tab 키: 다음 컬럼으로 포커스 이동 */
  const moveToNext = (currentColumnId: number) => {
    if (!editingCell) return
    const idx = columns.findIndex((c) => c.id === currentColumnId)
    const nextCol = columns[idx + 1]
    if (nextCol) {
      const item = items.find((i) => i.id === editingCell.itemId)
      const nextValue = item?.values.find((v) => v.columnId === nextCol.id)?.value ?? ''
      setEditingCell({ itemId: editingCell.itemId, columnId: nextCol.id, value: nextValue })
    }
  }

  return { editingCell, activate, change, commit, cancel, moveToNext }
}

import { useRef, useState } from 'react'
import { Plus, Trash2, ChevronDown, GripVertical, Pencil } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { TypeIcon } from '../../../entities/column'
import { GridCell } from '../../../features/edit-inventory-item/ui/GridCell'
import { useEditCell } from '../../../features/edit-inventory-item/model/useEditCell'
import { GRID_COL_WIDTH, GRID_ROW_NUM_WIDTH } from '../../../shared/config/constants'
import type { Column } from '../../../entities/column'
import type { InventoryItem } from '../../../entities/inventory-item'

interface InventoryGridProps {
  columns: Column[]
  items: InventoryItem[]
  /** 셀 편집 커밋 — 로컬 dirty state 업데이트 (서버 저장 아님) */
  onCellChange: (itemId: number, allValues: Record<number, string>) => void
  onAddColumn: () => void
  onDeleteColumn: (columnId: number) => void
  onRenameColumn: (columnId: number, name: string) => void
  onDeleteItem: (itemId: number) => void
  onAddRecord: () => void
  onReorderColumns: (orderedIds: number[]) => void
  /** 미저장 셀 변경 목록: itemId → 변경된 columnId Set */
  dirtyItems: Record<number, Record<number, string>>
  /** 미저장 컬럼 이름/순서 변경 ID 목록 */
  dirtyColumnIds: Set<number>
}

/** 드래그 + 인라인 rename 이 가능한 컬럼 헤더 셀 */
function SortableColumnHeader({
  col,
  openMenuColumnId,
  renamingColumnId,
  renameValue,
  renameInputRef,
  isDirty,
  onMenuToggle,
  onDeleteColumn,
  onRenameStart,
  onRenameChange,
  onRenameCommit,
  onRenameCancel,
}: {
  col: Column
  openMenuColumnId: number | null
  renamingColumnId: number | null
  renameValue: string
  renameInputRef: React.RefObject<HTMLInputElement | null>
  isDirty: boolean
  onMenuToggle: (id: number) => void
  onDeleteColumn: (id: number) => void
  onRenameStart: (id: number, currentName: string) => void
  onRenameChange: (value: string) => void
  onRenameCommit: (id: number) => void
  onRenameCancel: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: col.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const isRenaming = renamingColumnId === col.id

  return (
    <th
      ref={setNodeRef}
      style={style}
      className={`relative border-b border-r border-[#e0e0e0] px-2 py-0 font-normal text-left group
        ${isDirty ? 'bg-amber-50' : 'bg-[#f5f5f5]'}`}
    >
      <div className="flex items-center gap-1.5 h-8">
        <span
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 opacity-0 group-hover:opacity-100 shrink-0"
        >
          <GripVertical className="w-3 h-3" />
        </span>
        <TypeIcon dataType={col.dataType} className="w-3.5 h-3.5 text-gray-400 shrink-0" />

        {isRenaming ? (
          <input
            ref={renameInputRef}
            className="flex-1 min-w-0 px-1 py-0 text-xs bg-white border border-blue-400 rounded outline-none"
            value={renameValue}
            onChange={(e) => onRenameChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); onRenameCommit(col.id) }
              if (e.key === 'Escape') { e.preventDefault(); onRenameCancel() }
            }}
            onBlur={() => onRenameCommit(col.id)}
          />
        ) : (
          <span className="truncate text-xs text-gray-600 font-medium flex-1">{col.name}</span>
        )}

        {!isRenaming && (
          <button
            onClick={(e) => { e.stopPropagation(); onMenuToggle(col.id) }}
            className="p-0.5 rounded hover:bg-gray-200 text-gray-400"
          >
            <ChevronDown className="w-3 h-3" />
          </button>
        )}
      </div>

      {openMenuColumnId === col.id && (
        <div
          className="absolute top-8 left-0 z-30 bg-white border border-gray-200 rounded shadow-lg py-1 min-w-36"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => { onRenameStart(col.id, col.name); onMenuToggle(col.id) }}
            className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
          >
            <Pencil className="w-3 h-3" />필드 이름 변경
          </button>
          <button
            onClick={() => { onDeleteColumn(col.id); onMenuToggle(col.id) }}
            className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-3 h-3" />필드 삭제
          </button>
        </div>
      )}
    </th>
  )
}

/**
 * 인벤토리 그리드 위젯
 * 변경 사항은 dirty state로만 관리하고 저장 버튼 클릭 시 서버에 반영한다
 * dirty 셀/헤더는 amber-50 배경으로 표시된다
 */
export function InventoryGrid({
  columns, items, onCellChange,
  onAddColumn, onDeleteColumn, onRenameColumn, onDeleteItem, onAddRecord,
  onReorderColumns, dirtyItems, dirtyColumnIds,
}: InventoryGridProps) {
  const [openMenuColumnId, setOpenMenuColumnId] = useState<number | null>(null)
  const [hoveredRowId, setHoveredRowId] = useState<number | null>(null)

  const [renamingColumnId, setRenamingColumnId] = useState<number | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const renameInputRef = useRef<HTMLInputElement>(null)

  const { editingCell, activate, change, commit, cancel, moveToNext } =
    useEditCell(columns, items, onCellChange)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = columns.findIndex((c) => c.id === active.id)
    const newIndex = columns.findIndex((c) => c.id === over.id)
    const reordered = arrayMove(columns, oldIndex, newIndex)
    onReorderColumns(reordered.map((c) => c.id))
  }

  const handleRenameStart = (id: number, currentName: string) => {
    setRenamingColumnId(id)
    setRenameValue(currentName)
    setTimeout(() => renameInputRef.current?.select(), 0)
  }

  const handleRenameCommit = (id: number) => {
    const name = renameValue.trim()
    if (name) onRenameColumn(id, name)
    setRenamingColumnId(null)
  }

  const totalWidth = GRID_ROW_NUM_WIDTH + columns.length * GRID_COL_WIDTH + 40

  return (
    <div className="overflow-auto flex-1" onClick={() => setOpenMenuColumnId(null)}>
      <table className="border-collapse text-sm" style={{ minWidth: totalWidth, tableLayout: 'fixed' }}>
        <colgroup>
          <col style={{ width: GRID_ROW_NUM_WIDTH }} />
          {columns.map((col) => <col key={col.id} style={{ width: GRID_COL_WIDTH }} />)}
          <col style={{ width: 40 }} />
        </colgroup>

        {/* ── 헤더 ── */}
        <thead>
          <tr className="bg-[#f5f5f5]">
            <th className="sticky left-0 z-20 bg-[#f5f5f5] border-b border-r border-[#e0e0e0] text-center text-xs text-gray-400 font-normal select-none">
              #
            </th>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={columns.map((c) => c.id)} strategy={horizontalListSortingStrategy}>
                {columns.map((col) => (
                  <SortableColumnHeader
                    key={col.id}
                    col={col}
                    openMenuColumnId={openMenuColumnId}
                    renamingColumnId={renamingColumnId}
                    renameValue={renameValue}
                    renameInputRef={renameInputRef}
                    isDirty={dirtyColumnIds.has(col.id)}
                    onMenuToggle={(id) => setOpenMenuColumnId(openMenuColumnId === id ? null : id)}
                    onDeleteColumn={onDeleteColumn}
                    onRenameStart={handleRenameStart}
                    onRenameChange={setRenameValue}
                    onRenameCommit={handleRenameCommit}
                    onRenameCancel={() => setRenamingColumnId(null)}
                  />
                ))}
              </SortableContext>
            </DndContext>
            <th className="border-b border-[#e0e0e0]">
              <button
                onClick={onAddColumn}
                className="w-full h-8 flex items-center justify-center text-gray-400 hover:bg-gray-100"
              >
                <Plus className="w-4 h-4" />
              </button>
            </th>
          </tr>
        </thead>

        {/* ── 데이터 행 ── */}
        <tbody>
          {items.map((item, rowIndex) => (
            <tr
              key={item.id}
              onMouseEnter={() => setHoveredRowId(item.id)}
              onMouseLeave={() => setHoveredRowId(null)}
              className={hoveredRowId === item.id ? 'bg-[#f9f9f9]' : 'bg-white'}
            >
              <td
                className="sticky left-0 z-10 border-b border-r border-[#e0e0e0] text-center text-xs text-gray-400 select-none"
                style={{ background: hoveredRowId === item.id ? '#f9f9f9' : 'white' }}
              >
                {hoveredRowId === item.id
                  ? (
                    <button
                      onClick={() => onDeleteItem(item.id)}
                      className="w-full h-8 flex items-center justify-center text-red-400 hover:text-red-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )
                  : <span className="flex items-center justify-center h-8">{rowIndex + 1}</span>
                }
              </td>
              {columns.map((col) => {
                const cell = item.values.find((v) => v.columnId === col.id)
                const isEditing = editingCell?.itemId === item.id && editingCell?.columnId === col.id
                const isCellDirty = dirtyItems[item.id]?.[col.id] !== undefined
                return (
                  <GridCell key={col.id} column={col}
                    value={cell?.value ?? ''} displayValue={cell?.displayValue}
                    isEditing={isEditing} editValue={isEditing ? (editingCell?.value ?? '') : ''}
                    isDirty={isCellDirty}
                    onActivate={() => activate(item.id, col.id, cell?.value ?? '')}
                    onChange={change} onCommit={commit} onCancel={cancel}
                    onTabNext={() => moveToNext(col.id)}
                  />
                )
              })}
              <td className="border-b border-[#e0e0e0]" />
            </tr>
          ))}
          <tr>
            <td colSpan={columns.length + 2} className="border-b border-[#e0e0e0]">
              <button
                onClick={onAddRecord}
                className="flex items-center gap-1.5 px-3 h-8 w-full text-xs text-gray-400 hover:text-gray-600 hover:bg-[#f5f5f5]"
              >
                <Plus className="w-3.5 h-3.5" />레코드 추가
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

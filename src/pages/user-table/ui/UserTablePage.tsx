import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, Save } from 'lucide-react'
import { InventoryGrid } from '../../../widgets/inventory-grid/ui/InventoryGrid'
import { AddColumnModal } from '../../../features/manage-columns/ui/AddColumnModal'
import { Spinner } from '../../../shared/ui/Spinner'
import { useColumns, useCreateColumn, useRenameColumn, useDeleteColumn, useReorderColumns } from '../../../entities/column'
import { useInventoryItems, useCreateInventoryItem, useUpdateInventoryItem, useDeleteInventoryItem } from '../../../entities/inventory-item'
import { useUserTables, useRenameUserTable } from '../../../entities/user-table'
import { useUIStore } from '../../../shared/store/uiStore'
import type { Column } from '../../../entities/column'
import type { InventoryItem } from '../../../entities/inventory-item'

/**
 * 사용자 정의 테이블 그리드 페이지
 * 모든 변경은 로컬 dirty state에만 저장되고, 저장 버튼 클릭 시 서버에 일괄 반영된다
 * dirty 항목은 amber-50 배경으로 시각적으로 구분된다
 */
export default function UserTablePage() {
  const { id } = useParams<{ id: string }>()
  const tableId = Number(id)

  const { data: allTables = [] } = useUserTables()
  const { data: columns = [], isLoading: colLoading } = useColumns(tableId)
  const { data: items = [], isLoading: itemLoading } = useInventoryItems(tableId)

  const renameTable = useRenameUserTable()
  const { dirtyTableNames, clearDirtyTableName } = useUIStore()

  const createColumn = useCreateColumn(tableId)
  const renameColumn = useRenameColumn(tableId)
  const deleteColumn = useDeleteColumn(tableId)
  const reorderColumns = useReorderColumns(tableId)
  const createItem = useCreateInventoryItem(tableId)
  const updateItem = useUpdateInventoryItem(tableId)
  const deleteItem = useDeleteInventoryItem(tableId)

  const [showAddColumnModal, setShowAddColumnModal] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  /**
   * dirty state — 서버에 아직 저장되지 않은 변경사항
   * dirtyItems: itemId → { columnId → 변경값 }
   * dirtyColumnNames: columnId → 변경된 컬럼 이름
   * columnOrder: 변경된 컬럼 순서 ID 배열 (null이면 서버 순서 그대로)
   */
  const [dirtyItems, setDirtyItems] = useState<Record<number, Record<number, string>>>({})
  const [dirtyColumnNames, setDirtyColumnNames] = useState<Record<number, string>>({})
  const [columnOrder, setColumnOrder] = useState<number[] | null>(null)

  const isDirty =
    Object.keys(dirtyItems).length > 0 ||
    Object.keys(dirtyColumnNames).length > 0 ||
    columnOrder !== null ||
    dirtyTableNames[tableId] !== undefined

  /** 서버 데이터에 dirty state를 오버레이한 표시용 컬럼 목록 */
  const displayColumns = useMemo<Column[]>(() => {
    const named = columns.map((col) => ({
      ...col,
      name: dirtyColumnNames[col.id] ?? col.name,
    }))
    if (!columnOrder) return named
    return columnOrder
      .map((id) => named.find((c) => c.id === id))
      .filter((c): c is Column => c !== undefined)
  }, [columns, dirtyColumnNames, columnOrder])

  /** 서버 데이터에 dirty state를 오버레이한 표시용 아이템 목록 */
  const displayItems = useMemo<InventoryItem[]>(() => {
    return items.map((item) => {
      const dirty = dirtyItems[item.id]
      if (!dirty) return item
      return {
        ...item,
        values: item.values.map((v) => ({
          ...v,
          value: dirty[v.columnId] !== undefined ? dirty[v.columnId] : v.value,
        })),
      }
    })
  }, [items, dirtyItems])

  /** dirty인 컬럼 ID 집합 (이름 변경 + 순서 변경 모두 포함) */
  const dirtyColumnIds = useMemo<Set<number>>(() => {
    const ids = new Set<number>(Object.keys(dirtyColumnNames).map(Number))
    // 순서가 바뀐 컬럼도 표시
    if (columnOrder) {
      columnOrder.forEach((id, i) => {
        const original = columns.findIndex((c) => c.id === id)
        if (original !== i) ids.add(id)
      })
    }
    return ids
  }, [dirtyColumnNames, columnOrder, columns])

  /** 셀 편집 커밋 — 로컬 dirty state만 업데이트 */
  const handleCellChange = (itemId: number, allValues: Record<number, string>) => {
    setDirtyItems((prev) => ({ ...prev, [itemId]: allValues }))
  }

  /** 컬럼 이름 변경 — 로컬 dirty state만 업데이트 */
  const handleColumnRename = (columnId: number, name: string) => {
    setDirtyColumnNames((prev) => ({ ...prev, [columnId]: name }))
  }

  /** 컬럼 순서 변경 — 로컬 dirty state만 업데이트 */
  const handleReorder = (orderedIds: number[]) => {
    setColumnOrder(orderedIds)
  }

  /** 저장 버튼 — 모든 dirty state를 서버에 일괄 반영 */
  const handleSave = async () => {
    setIsSaving(true)
    try {
      // 1. 변경된 아이템 셀 값 저장
      await Promise.all(
        Object.entries(dirtyItems).map(([itemIdStr, values]) =>
          updateItem.mutateAsync({ itemId: Number(itemIdStr), dto: { values } })
        )
      )

      // 2. 변경된 컬럼 이름 저장
      await Promise.all(
        Object.entries(dirtyColumnNames).map(([columnIdStr, name]) =>
          renameColumn.mutateAsync({ columnId: Number(columnIdStr), name })
        )
      )

      // 3. 변경된 컬럼 순서 저장
      if (columnOrder) {
        const orderMap: Record<number, number> = {}
        columnOrder.forEach((id, i) => { orderMap[id] = i + 1 })
        await reorderColumns.mutateAsync(orderMap)
      }

      // 4. 변경된 테이블 이름 저장
      if (dirtyTableNames[tableId]) {
        await renameTable.mutateAsync({ id: tableId, name: dirtyTableNames[tableId] })
        clearDirtyTableName(tableId)
      }

      // dirty state 초기화
      setDirtyItems({})
      setDirtyColumnNames({})
      setColumnOrder(null)
    } finally {
      setIsSaving(false)
    }
  }

  const serverTableName = allTables.find((t) => t.id === tableId)?.name ?? ''
  const tableName = dirtyTableNames[tableId] ?? serverTableName
  const isLoading = colLoading || itemLoading

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* 툴바 */}
      <div className="flex items-center justify-between px-5 py-2 border-b border-[#e0e0e0] bg-white shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold text-gray-900">{tableName}</h1>
          {isLoading && <Spinner className="w-3.5 h-3.5" />}
          {isDirty && !isLoading && (
            <span className="text-xs text-amber-600 font-medium">저장되지 않은 변경사항</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowAddColumnModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 rounded hover:bg-gray-50 text-gray-600">
            <Plus className="w-3.5 h-3.5" />필드 추가
          </button>
          {/* 저장 버튼 — dirty 변경이 있을 때만 활성화 */}
          <button
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded font-medium transition-colors
              ${isDirty && !isSaving
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
          >
            {isSaving ? <Spinner className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            저장
          </button>
        </div>
      </div>

      {/* 그리드 위젯 */}
      <InventoryGrid
        columns={displayColumns}
        items={displayItems}
        onCellChange={handleCellChange}
        onAddColumn={() => setShowAddColumnModal(true)}
        onRenameColumn={handleColumnRename}
        onDeleteColumn={(columnId) => deleteColumn.mutate(columnId)}
        onDeleteItem={(itemId) => deleteItem.mutate(itemId)}
        onAddRecord={() => createItem.mutate({ values: {} })}
        onReorderColumns={handleReorder}
        dirtyItems={dirtyItems}
        dirtyColumnIds={dirtyColumnIds}
      />

      {showAddColumnModal && (
        <AddColumnModal
          currentTableId={tableId}
          allTables={allTables}
          onConfirm={async (dto) => { await createColumn.mutateAsync(dto) }}
          onClose={() => setShowAddColumnModal(false)}
        />
      )}
    </div>
  )
}

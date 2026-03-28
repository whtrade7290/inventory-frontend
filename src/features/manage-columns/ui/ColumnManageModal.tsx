import { useState } from 'react'
import { Trash2, Lock } from 'lucide-react'
import { Modal } from '../../../shared/ui/Modal'
import { Button } from '../../../shared/ui/Button'
import { TypeIcon } from '../../../entities/column'
import { useColumns, useCreateColumn, useDeleteColumn } from '../../../entities/column'
import type { DataType } from '../../../entities/column'

const DATA_TYPES: { type: DataType; label: string }[] = [
  { type: 'TEXT',    label: '텍스트'   },
  { type: 'NUMBER',  label: '숫자'     },
  { type: 'DATE',    label: '날짜'     },
  { type: 'BOOLEAN', label: '체크박스' },
]

interface ColumnManageModalProps {
  tableId: number
  onClose: () => void
}

/**
 * 컬럼 관리 모달 — 현재 컬럼 목록 조회/삭제 + 신규 컬럼 추가
 * 데이터 입력은 입고 관리에서만 하므로 RELATION 타입은 제외한다
 */
export function ColumnManageModal({ tableId, onClose }: ColumnManageModalProps) {
  const { data: columns = [], isLoading } = useColumns(tableId)
  const createColumn = useCreateColumn(tableId)
  const deleteColumn = useDeleteColumn(tableId)

  const [name, setName] = useState('')
  const [dataType, setDataType] = useState<DataType>('TEXT')
  const [deleteError, setDeleteError] = useState<string | null>(null)

  /** 컬럼 추가 */
  async function handleAdd() {
    const trimmed = name.trim()
    if (!trimmed) return
    await createColumn.mutateAsync({ name: trimmed, dataType })
    setName('')
    setDataType('TEXT')
  }

  /** 컬럼 삭제 — 다른 테이블에서 RELATION 참조 중이면 백엔드에서 거부 */
  async function handleDelete(columnId: number) {
    setDeleteError(null)
    try {
      await deleteColumn.mutateAsync(columnId)
    } catch {
      setDeleteError('삭제 실패: 다른 테이블에서 참조 중인 컬럼입니다.')
    }
  }

  return (
    <Modal title="컬럼 관리" onClose={onClose} className="w-[480px]">
      {/* 현재 컬럼 목록 */}
      <div className="mb-5">
        <p className="text-xs font-medium text-gray-500 mb-2">현재 컬럼</p>
        {isLoading ? (
          <p className="text-xs text-gray-400 py-2">불러오는 중...</p>
        ) : columns.length === 0 ? (
          <p className="text-xs text-gray-400 py-2">등록된 컬럼이 없습니다.</p>
        ) : (
          <div className="border border-gray-100 rounded overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-3 py-2 text-gray-500 font-medium">컬럼명</th>
                  <th className="text-left px-3 py-2 text-gray-500 font-medium">타입</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {columns.map((col) => (
                  <tr
                    key={col.id}
                    className={`border-t border-gray-100 ${col.isSystem ? 'bg-gray-50/80' : 'hover:bg-gray-50'}`}
                  >
                    <td className="px-3 py-2">
                      <span className="flex items-center gap-1.5">
                        {/* 시스템 컬럼은 잠금 아이콘 표시 */}
                        {col.isSystem && (
                          <span title="시스템 컬럼 — 수정/삭제 불가">
                            <Lock className="w-3 h-3 text-gray-400 shrink-0" />
                          </span>
                        )}
                        <span className={col.isSystem ? 'text-gray-500' : 'text-gray-800'}>
                          {col.name}
                        </span>
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="flex items-center gap-1.5 text-gray-500">
                        <TypeIcon dataType={col.dataType} className="w-3.5 h-3.5 shrink-0" />
                        {DATA_TYPES.find((d) => d.type === col.dataType)?.label ?? col.dataType}
                      </span>
                    </td>
                    <td className="px-2 py-2">
                      {/* 시스템 컬럼은 삭제 버튼 숨김 */}
                      {!col.isSystem && (
                        <button
                          onClick={() => handleDelete(col.id)}
                          className="text-gray-300 hover:text-red-500 transition-colors"
                          title="컬럼 삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {deleteError && (
          <p className="mt-2 text-xs text-red-500 bg-red-50 border border-red-100 rounded px-3 py-2">
            {deleteError}
          </p>
        )}
      </div>

      <hr className="border-gray-100 mb-4" />

      {/* 컬럼 추가 폼 */}
      <div className="mb-4">
        <p className="text-xs font-medium text-gray-500 mb-2">컬럼 추가</p>
        <div className="flex gap-2">
          <input
            autoFocus
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="컬럼명 입력"
            className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <select
            value={dataType}
            onChange={(e) => setDataType(e.target.value as DataType)}
            className="px-2 py-1.5 text-sm border border-gray-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {DATA_TYPES.map(({ type, label }) => (
              <option key={type} value={type}>{label}</option>
            ))}
          </select>
          <Button
            variant="primary"
            size="sm"
            onClick={handleAdd}
            disabled={!name.trim() || createColumn.isPending}
          >
            추가
          </Button>
        </div>
      </div>

      <div className="flex justify-end">
        <Button variant="secondary" size="sm" onClick={onClose}>닫기</Button>
      </div>
    </Modal>
  )
}

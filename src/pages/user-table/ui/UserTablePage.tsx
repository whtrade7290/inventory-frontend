import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Table2, Lock, Settings2, PackagePlus } from 'lucide-react'
import { Button } from '../../../shared/ui/Button'
import { Spinner } from '../../../shared/ui/Spinner'
import { TypeIcon } from '../../../entities/column'
import { useColumns } from '../../../entities/column'
import { useUserTables } from '../../../entities/user-table'
import { useInventoryItems } from '../../../entities/inventory-item'
import { ColumnManageModal } from '../../../features/manage-columns/ui/ColumnManageModal'

const TYPE_LABELS: Record<string, string> = {
  TEXT:     '텍스트',
  NUMBER:   '숫자',
  DATE:     '날짜',
  BOOLEAN:  '체크박스',
  RELATION: '관계',
}

/**
 * 테이블 상세 페이지 — 읽기 전용
 * 좌측: 레코드(데이터) 그리드 / 우측: 컬럼 정의 목록
 * 두 패널 모두 독립적으로 overflow 스크롤된다
 */
export default function UserTablePage() {
  const { id } = useParams<{ id: string }>()
  const tableId = Number(id)

  const { data: allTables = [] } = useUserTables()
  const { data: columns = [], isLoading: colLoading } = useColumns(tableId)
  const { data: items = [], isLoading: itemLoading } = useInventoryItems(tableId)
  const [showManageModal, setShowManageModal] = useState(false)

  const tableName = allTables.find((t) => t.id === tableId)?.name ?? ''
  const isLoading = colLoading || itemLoading

  /** 사용자 정의 컬럼만 (시스템 컬럼 제외) */
  const userColumns = columns.filter((c) => !c.isSystem)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── 툴바 ── */}
      <div className="flex items-center justify-between px-5 py-2.5 border-b border-[#e0e0e0] bg-white shrink-0">
        <div className="flex items-center gap-2">
          <Table2 className="w-4 h-4 text-gray-400" />
          <h1 className="text-sm font-semibold text-gray-800">{tableName}</h1>
          {isLoading && <Spinner className="w-3.5 h-3.5" />}
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 text-[11px] font-medium text-gray-400 bg-gray-100 rounded border border-gray-200">
            읽기 전용
          </span>
          <Button variant="secondary" size="sm" onClick={() => setShowManageModal(true)}>
            <Settings2 className="w-3.5 h-3.5" />
            필드 관리
          </Button>
        </div>
      </div>

      {/* ── 좌우 분할 패널 ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── 좌측: 레코드(데이터) ── */}
        <div className="flex-1 flex flex-col overflow-hidden border-r border-gray-200">
          <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50 shrink-0">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              데이터 ({items.length}건)
            </p>
          </div>

          <div className="flex-1 overflow-auto">
            {itemLoading ? (
              <div className="flex items-center gap-2 text-xs text-gray-400 p-4">
                <Spinner className="w-3.5 h-3.5" /> 불러오는 중...
              </div>
            ) : userColumns.length === 0 ? (
              <p className="text-xs text-gray-400 p-4">표시할 컬럼이 없습니다.</p>
            ) : (
              <table className="w-full text-sm border-collapse">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                  <tr>
                    <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 border-r border-gray-100 w-10">
                      #
                    </th>
                    {userColumns.map((col) => (
                      <th
                        key={col.id}
                        className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 border-r border-gray-100 last:border-r-0"
                      >
                        <span className="flex items-center gap-1.5">
                          <TypeIcon dataType={col.dataType} className="w-3 h-3 shrink-0 text-gray-400" />
                          {col.name}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    /* 컬럼은 있지만 데이터가 없을 때 — 빈 안내 행 */
                    <tr>
                      <td
                        colSpan={1 + userColumns.length}
                        className="px-3 py-10 text-center"
                      >
                        <div className="flex flex-col items-center gap-3 text-gray-400">
                          <PackagePlus className="w-8 h-8 text-gray-200" />
                          <p className="text-xs text-gray-500">데이터가 없습니다</p>
                          <Link
                            to="/inbound"
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors"
                          >
                            <PackagePlus className="w-3 h-3" />
                            입고 관리로 이동
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    items.map((item, rowIdx) => (
                      <tr key={item.id} className="border-t border-gray-100 hover:bg-gray-50/60">
                        <td className="px-3 py-2.5 text-xs text-gray-400 border-r border-gray-100 text-center">
                          {rowIdx + 1}
                        </td>
                        {userColumns.map((col) => {
                          const cell = item.values.find((v) => v.columnId === col.id)
                          const display = cell?.displayValue ?? cell?.value ?? ''
                          return (
                            <td
                              key={col.id}
                              className="px-3 py-2.5 text-sm text-gray-700 border-r border-gray-100 last:border-r-0 truncate max-w-xs"
                            >
                              {col.dataType === 'BOOLEAN' ? (display === 'true' ? '✓' : '') : display}
                            </td>
                          )
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ── 우측: 컬럼 정의 ── */}
        <div className="w-80 shrink-0 flex flex-col overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50 shrink-0">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              컬럼 ({columns.length}개)
            </p>
          </div>

          <div className="flex-1 overflow-auto">
            {colLoading ? (
              <div className="flex items-center gap-2 text-xs text-gray-400 p-4">
                <Spinner className="w-3.5 h-3.5" /> 불러오는 중...
              </div>
            ) : columns.length === 0 ? (
              <p className="text-xs text-gray-400 p-4">
                컬럼이 없습니다.{' '}
                <button className="text-blue-500 hover:underline" onClick={() => setShowManageModal(true)}>
                  필드 관리
                </button>
                에서 추가하세요.
              </p>
            ) : (
              <table className="w-full text-xs border-collapse">
                <thead className="bg-gray-50 border-b border-gray-100 sticky top-0">
                  <tr>
                    <th className="text-left px-3 py-2 text-gray-500 font-medium">컬럼명</th>
                    <th className="text-left px-3 py-2 text-gray-500 font-medium">타입</th>
                  </tr>
                </thead>
                <tbody>
                  {columns.map((col) => (
                    <tr
                      key={col.id}
                      className={`border-t border-gray-100 ${col.isSystem ? 'bg-gray-50/60' : ''}`}
                    >
                      <td className="px-3 py-2">
                        <span className="flex items-center gap-1.5">
                          {col.isSystem && (
                            <span title="시스템 컬럼">
                              <Lock className="w-3 h-3 text-gray-400 shrink-0" />
                            </span>
                          )}
                          <span className={col.isSystem ? 'text-gray-500' : 'text-gray-800 font-medium'}>
                            {col.name}
                          </span>
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className="flex items-center gap-1 text-gray-500">
                          <TypeIcon dataType={col.dataType} className="w-3.5 h-3.5 shrink-0" />
                          {TYPE_LABELS[col.dataType] ?? col.dataType}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* 필드 관리 모달 */}
      {showManageModal && (
        <ColumnManageModal tableId={tableId} onClose={() => setShowManageModal(false)} />
      )}
    </div>
  )
}

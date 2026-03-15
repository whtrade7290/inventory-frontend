import { useRef, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { BarChart2, PackagePlus, PackageMinus, Table2, Plus, Trash2 } from 'lucide-react'
import { useUserTables, useCreateUserTable, useDeleteUserTable } from '../../../entities/user-table'
import { useUIStore } from '../../../shared/store/uiStore'

const navClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2.5 px-3 py-2 mx-1 rounded text-sm transition-colors
  ${isActive ? 'bg-white text-gray-900 shadow-sm font-medium' : 'text-gray-500 hover:bg-[#e8e8e8] hover:text-gray-700'}`

/**
 * 앱 사이드바 위젯
 * entities/user-table의 훅을 직접 사용해 테이블 목록을 관리한다
 * 고정 메뉴(재고/입고/출고)와 사용자 테이블 섹션으로 구성된다
 * 테이블 이름 더블클릭으로 인라인 rename 가능
 */
export function AppSidebar() {
  const navigate = useNavigate()
  const { data: tables = [] } = useUserTables()
  const createTable = useCreateUserTable()
  const deleteTable = useDeleteUserTable()
  const { dirtyTableNames, setDirtyTableName } = useUIStore()

  const [isCreating, setIsCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [hoveredId, setHoveredId] = useState<number | null>(null)

  /** 인라인 rename 상태 */
  const [renamingId, setRenamingId] = useState<number | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const renameInputRef = useRef<HTMLInputElement>(null)

  const handleCreate = async () => {
    const name = newName.trim()
    if (!name) return
    const created = await createTable.mutateAsync({ name })
    setNewName('')
    setIsCreating(false)
    navigate(`/tables/${created.id}`)
  }

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    if (!confirm('테이블을 삭제하시겠습니까?')) return
    try { await deleteTable.mutateAsync(id) }
    catch { alert('삭제 실패 (다른 테이블에서 참조 중일 수 있습니다)') }
  }

  /** 더블클릭 시 rename 모드 진입 */
  const handleDoubleClick = (id: number, currentName: string, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    setRenamingId(id)
    setRenameValue(currentName)
    setTimeout(() => renameInputRef.current?.select(), 0)
  }

  /** rename 확정 — 로컬 dirty state에만 저장 (서버 반영은 저장 버튼) */
  const handleRenameCommit = (id: number) => {
    const name = renameValue.trim()
    if (name) setDirtyTableName(id, name)
    setRenamingId(null)
  }

  return (
    <aside className="w-56 bg-[#f3f3f3] border-r border-[#e0e0e0] flex flex-col shrink-0">
      <nav className="flex-1 overflow-y-auto py-2">
        {/* 고정 메뉴 */}
        <NavLink to="/stock"    className={navClass}><BarChart2    className="w-4 h-4 shrink-0" />재고 현황</NavLink>
        <NavLink to="/inbound"  className={navClass}><PackagePlus  className="w-4 h-4 shrink-0" />입고 관리</NavLink>
        <NavLink to="/outbound" className={navClass}><PackageMinus className="w-4 h-4 shrink-0" />출고 관리</NavLink>

        {/* 구분선 */}
        <div className="mx-3 my-2 border-t border-[#e0e0e0]" />
        <p className="px-4 py-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">테이블</p>

        {/* 사용자 정의 테이블 목록 */}
        {tables.map((table) => (
          <NavLink key={table.id} to={`/tables/${table.id}`} className={navClass}
            onMouseEnter={() => setHoveredId(table.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <Table2 className="w-4 h-4 shrink-0 text-gray-400" />

            {renamingId === table.id ? (
              /* 인라인 rename 입력 */
              <input
                ref={renameInputRef}
                className="flex-1 min-w-0 px-1 py-0 text-sm bg-white border border-blue-400 rounded outline-none"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); handleRenameCommit(table.id) }
                  if (e.key === 'Escape') setRenamingId(null)
                }}
                onBlur={() => handleRenameCommit(table.id)}
                onClick={(e) => e.preventDefault()}
              />
            ) : (
              /* 일반 표시 — dirty이면 amber 색상, 더블클릭으로 rename 진입 */
              <span
                className={`truncate flex-1 ${dirtyTableNames[table.id] ? 'text-amber-700' : ''}`}
                onDoubleClick={(e) => handleDoubleClick(table.id, dirtyTableNames[table.id] ?? table.name, e)}
              >
                {dirtyTableNames[table.id] ?? table.name}
              </span>
            )}

            {hoveredId === table.id && renamingId !== table.id && (
              <button onClick={(e) => handleDelete(table.id, e)}
                className="p-0.5 rounded hover:bg-red-100 text-gray-400 hover:text-red-500">
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </NavLink>
        ))}

        {/* 테이블 생성 인라인 입력 */}
        {isCreating && (
          <div className="mx-2 mt-1">
            <input autoFocus type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') { setIsCreating(false); setNewName('') } }}
              onBlur={() => { if (!newName.trim()) setIsCreating(false) }}
              placeholder="테이블 이름"
              className="w-full px-2 py-1.5 text-sm border border-blue-400 rounded outline-none bg-white"
            />
          </div>
        )}
      </nav>

      {/* 테이블 추가 버튼 */}
      <div className="p-2 border-t border-[#e0e0e0]">
        <button onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-500 hover:bg-[#e8e8e8] rounded">
          <Plus className="w-3.5 h-3.5" />테이블 추가
        </button>
      </div>
    </aside>
  )
}

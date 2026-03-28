import { useState } from 'react'
import { PackageMinus, Plus, X, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '../../../shared/ui/Button'
import { Modal } from '../../../shared/ui/Modal'
import { Spinner } from '../../../shared/ui/Spinner'
import { useProjects, useProjectDetail, useCreateProject } from '../../../entities/project'
import { useStockSummary } from '../../../entities/stock'
import type { StockSummaryItem } from '../../../entities/stock'
import type { Project } from '../../../entities/project'

// ─── 부품 표시명 유틸 ────────────────────────────────────────────────────────

/**
 * StockSummaryItem의 values 배열에서 부품명을 추출한다
 * "이름", "부품명", "명칭" 컬럼 우선, 없으면 첫 번째 값, 그것도 없으면 아이템 ID 표시
 */
function getPartName(item: StockSummaryItem): string {
  if (item.values.length === 0) return `아이템 #${item.inventoryItemId}`
  const nameKeywords = ['이름', '부품명', '명칭', '품명', 'name']
  const nameCol = item.values.find((v) =>
    nameKeywords.some((k) => v.columnName.toLowerCase().includes(k)),
  )
  return nameCol?.value ?? item.values[0].value ?? `아이템 #${item.inventoryItemId}`
}

// ─── BOM 줄 타입 (모달 내부 상태) ────────────────────────────────────────────

interface BomLine {
  inventoryItemId: number
  partName: string
  stockQuantity: number
  quantity: number
}

// ─── 프로젝트 등록 모달 ──────────────────────────────────────────────────────

interface RegisterProjectModalProps {
  onClose: () => void
}

function RegisterProjectModal({ onClose }: RegisterProjectModalProps) {
  const [name, setName] = useState('')
  const [contractor, setContractor] = useState('')
  const [date, setDate] = useState('')
  const [bomLines, setBomLines] = useState<BomLine[]>([])

  // 부품 추가 섹션 상태
  const [selectedItemId, setSelectedItemId] = useState<number | ''>('')
  const [addQty, setAddQty] = useState<number>(1)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const { data: stockItems = [], isLoading: stockLoading } = useStockSummary()
  const createProject = useCreateProject()

  /** 부품 추가 버튼 — 이미 목록에 있으면 수량 합산 */
  function handleAddBomLine() {
    if (!selectedItemId) return
    const item = stockItems.find((s) => s.inventoryItemId === selectedItemId)
    if (!item) return

    setBomLines((prev) => {
      const existing = prev.find((b) => b.inventoryItemId === selectedItemId)
      if (existing) {
        return prev.map((b) =>
          b.inventoryItemId === selectedItemId ? { ...b, quantity: b.quantity + addQty } : b,
        )
      }
      return [
        ...prev,
        {
          inventoryItemId: item.inventoryItemId,
          partName: getPartName(item),
          stockQuantity: item.stockQuantity,
          quantity: addQty,
        },
      ]
    })
    setSelectedItemId('')
    setAddQty(1)
  }

  /** BOM 줄 삭제 */
  function handleRemoveBomLine(inventoryItemId: number) {
    setBomLines((prev) => prev.filter((b) => b.inventoryItemId !== inventoryItemId))
  }

  /** 등록 버튼 */
  async function handleSubmit() {
    if (!name.trim()) {
      setErrorMsg('현장명을 입력해 주세요.')
      return
    }
    if (bomLines.length === 0) {
      setErrorMsg('부품을 하나 이상 추가해 주세요.')
      return
    }

    setErrorMsg(null)
    try {
      await createProject.mutateAsync({
        name: name.trim(),
        contractor: contractor.trim() || null,
        date: date || null,
        bomItems: bomLines.map((b) => ({
          inventoryItemId: b.inventoryItemId,
          quantity: b.quantity,
        })),
      })
      onClose()
    } catch (err: unknown) {
      // 백엔드 400 응답의 { message } 추출
      const axiosErr = err as { response?: { data?: { message?: string } } }
      const msg = axiosErr?.response?.data?.message ?? '등록에 실패했습니다.'
      setErrorMsg(msg)
    }
  }

  return (
    <Modal title="프로젝트 등록" onClose={onClose} className="w-[520px] max-h-[90vh] overflow-y-auto">
      {/* 기본 정보 */}
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">현장명 *</label>
          <input
            className="border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="예) 강남 현장"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-xs text-gray-500">시공사명</label>
            <input
              className="border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="예) ABC건설"
              value={contractor}
              onChange={(e) => setContractor(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1 w-36">
            <label className="text-xs text-gray-500">날짜</label>
            <input
              type="date"
              className="border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      <hr className="border-gray-100 mb-4" />

      {/* 부품 추가 섹션 */}
      <p className="text-xs font-medium text-gray-600 mb-2">부품 추가</p>
      <div className="flex gap-2 mb-3">
        {stockLoading ? (
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Spinner className="w-3 h-3" /> 로딩 중...
          </div>
        ) : (
          <>
            <select
              className="flex-1 border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value === '' ? '' : Number(e.target.value))}
            >
              <option value="">부품 선택</option>
              {stockItems.map((item) => (
                <option key={item.inventoryItemId} value={item.inventoryItemId}>
                  {getPartName(item)} (재고: {item.stockQuantity})
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              className="w-20 border border-gray-200 rounded px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={addQty}
              onChange={(e) => setAddQty(Math.max(1, Number(e.target.value)))}
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={handleAddBomLine}
              disabled={!selectedItemId}
            >
              <Plus className="w-3 h-3" />
              추가
            </Button>
          </>
        )}
      </div>

      {/* 추가된 BOM 목록 */}
      {bomLines.length > 0 && (
        <div className="border border-gray-100 rounded mb-4 overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2 text-gray-500 font-medium">부품명</th>
                <th className="text-right px-3 py-2 text-gray-500 font-medium">재고</th>
                <th className="text-right px-3 py-2 text-gray-500 font-medium">수량</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {bomLines.map((line) => (
                <tr key={line.inventoryItemId} className="border-t border-gray-100">
                  <td className="px-3 py-2 text-gray-800">{line.partName}</td>
                  <td className="px-3 py-2 text-right text-gray-400">{line.stockQuantity}</td>
                  <td className="px-3 py-2 text-right font-medium text-gray-800">{line.quantity}</td>
                  <td className="px-2 py-2">
                    <button
                      onClick={() => handleRemoveBomLine(line.inventoryItemId)}
                      className="text-gray-300 hover:text-red-400 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 에러 메시지 */}
      {errorMsg && (
        <p className="text-xs text-red-500 mb-3 bg-red-50 border border-red-100 rounded px-3 py-2">
          {errorMsg}
        </p>
      )}

      {/* 등록 버튼 */}
      <div className="flex justify-end">
        <Button
          variant="primary"
          size="md"
          onClick={handleSubmit}
          disabled={createProject.isPending}
        >
          {createProject.isPending ? '등록 중...' : '등록'}
        </Button>
      </div>
    </Modal>
  )
}

// ─── 프로젝트 상세 패널 ──────────────────────────────────────────────────────

interface ProjectDetailPanelProps {
  projectId: number
  onClose: () => void
}

function ProjectDetailPanel({ projectId, onClose }: ProjectDetailPanelProps) {
  const { data: project, isLoading } = useProjectDetail(projectId)

  return (
    <div className="border border-gray-200 rounded-lg bg-gray-50 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-gray-700">
          {isLoading ? '불러오는 중...' : project?.name}
        </p>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-4">
          <Spinner className="w-4 h-4" />
        </div>
      )}

      {project && (
        <>
          {/* 현장 기본 정보 */}
          <div className="flex gap-4 text-xs text-gray-500 mb-3">
            {project.contractor && (
              <span>시공사: <span className="text-gray-700">{project.contractor}</span></span>
            )}
            {project.date && (
              <span>날짜: <span className="text-gray-700">{project.date}</span></span>
            )}
          </div>

          {/* BOM 목록 */}
          {project.bomItems.length === 0 ? (
            <p className="text-xs text-gray-400">등록된 부품이 없습니다.</p>
          ) : (
            <table className="w-full text-xs border border-gray-200 rounded overflow-hidden">
              <thead className="bg-white">
                <tr>
                  <th className="text-left px-3 py-2 text-gray-500 font-medium border-b border-gray-100">
                    부품명
                  </th>
                  <th className="text-right px-3 py-2 text-gray-500 font-medium border-b border-gray-100">
                    수량
                  </th>
                </tr>
              </thead>
              <tbody>
                {project.bomItems.map((bom) => {
                  // 부품명: values 배열의 첫 번째 값 (상세 조회 응답에 포함됨)
                  const nameKeywords = ['이름', '부품명', '명칭', '품명', 'name']
                  const nameVal =
                    bom.values.find((v) =>
                      nameKeywords.some((k) => v.columnName.toLowerCase().includes(k)),
                    ) ?? bom.values[0]
                  const displayName = nameVal?.value ?? `아이템 #${bom.inventoryItemId}`

                  return (
                    <tr key={bom.id} className="border-t border-gray-100 hover:bg-white/60">
                      <td className="px-3 py-2 text-gray-800">{displayName}</td>
                      <td className="px-3 py-2 text-right font-medium text-gray-800">
                        {bom.quantity}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  )
}

// ─── 메인 페이지 ─────────────────────────────────────────────────────────────

/** 출고 관리 페이지 — 프로젝트 목록 + 등록 모달 + 상세 패널 */
export default function OutboundPage() {
  const [showModal, setShowModal] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)

  const { data: projects = [], isLoading } = useProjects()

  function handleRowClick(project: Project) {
    setSelectedProjectId((prev) => (prev === project.id ? null : project.id))
  }

  return (
    <div className="p-6 flex flex-col gap-4 h-full overflow-auto">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-700">
          <PackageMinus className="w-4 h-4" />
          <h1 className="text-sm font-semibold">출고 관리</h1>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>
          <Plus className="w-3 h-3" />
          프로젝트 등록
        </Button>
      </div>

      {/* 프로젝트 목록 */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner className="w-5 h-5" />
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <PackageMinus className="w-10 h-10 mb-3 text-gray-200" />
          <p className="text-sm">등록된 프로젝트가 없습니다.</p>
          <p className="text-xs mt-1">+ 프로젝트 등록 버튼으로 현장을 추가하세요.</p>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="w-6" />
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">현장명</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">시공사</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">날짜</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">부품 수</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => {
                const isSelected = selectedProjectId === project.id
                return (
                  <>
                    <tr
                      key={project.id}
                      className={`border-t border-gray-100 cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleRowClick(project)}
                    >
                      <td className="pl-3 py-3 text-gray-400">
                        {isSelected ? (
                          <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-800 font-medium">{project.name}</td>
                      <td className="px-4 py-3 text-gray-600">{project.contractor ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{project.date ?? '—'}</td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        {project.bomItems.length}개
                      </td>
                    </tr>
                    {isSelected && (
                      <tr key={`detail-${project.id}`} className="bg-blue-50/50">
                        <td colSpan={5} className="px-4 pb-4 pt-1">
                          <ProjectDetailPanel
                            projectId={project.id}
                            onClose={() => setSelectedProjectId(null)}
                          />
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 프로젝트 등록 모달 */}
      {showModal && <RegisterProjectModal onClose={() => setShowModal(false)} />}
    </div>
  )
}

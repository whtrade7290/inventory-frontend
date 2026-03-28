import { useState } from 'react'
import { PackagePlus, CheckCircle2 } from 'lucide-react'
import { Button } from '../../../shared/ui/Button'
import { Spinner } from '../../../shared/ui/Spinner'
import { useStockSummary, useInbound } from '../../../entities/stock'
import type { StockSummaryItem } from '../../../entities/stock'

/**
 * 부품명을 결정하는 헬퍼
 * values 배열에서 첫 번째 비어 있지 않은 값을 부품명으로 사용한다
 */
function getPartName(item: StockSummaryItem): string {
  const first = item.values.find((v) => v.value?.trim())
  return first ? first.value : `아이템 #${item.inventoryItemId}`
}

/**
 * 입고 관리 페이지
 * PARTS 테이블 부품 목록을 조회하고, 선택한 부품에 입고 수량을 등록한다
 * 등록 성공 시 stock.summary 쿼리가 무효화되어 목록이 자동 갱신된다
 */
export default function InboundPage() {
  const { data: summary = [], isLoading } = useStockSummary()
  const inbound = useInbound()

  /** 선택된 inventory_item ID */
  const [selectedItemId, setSelectedItemId] = useState<number | ''>('')
  /** 입고 수량 */
  const [quantity, setQuantity] = useState<number | ''>('')
  /** 성공 메시지 표시용 마지막 등록 부품명 */
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  /** 에러 메시지 */
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  /** 입고 등록 실행 */
  async function handleSubmit() {
    if (!selectedItemId || !quantity) return
    setSuccessMsg(null)
    setErrorMsg(null)

    const item = summary.find((s) => s.inventoryItemId === selectedItemId)
    const partName = item ? getPartName(item) : String(selectedItemId)

    try {
      await inbound.mutateAsync({ itemId: selectedItemId, quantity: Number(quantity) })
      setSuccessMsg(`${partName} — ${quantity}개 입고 완료`)
      setSelectedItemId('')
      setQuantity('')
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: string } })?.response?.data
      setErrorMsg(msg ?? '입고 등록에 실패했습니다.')
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── 툴바 ── */}
      <div className="flex items-center gap-2 px-5 py-2.5 border-b border-[#e0e0e0] bg-white shrink-0">
        <PackagePlus className="w-4 h-4 text-gray-400" />
        <h1 className="text-sm font-semibold text-gray-800">입고 관리</h1>
        {isLoading && <Spinner className="w-3.5 h-3.5" />}
      </div>

      <div className="flex-1 overflow-auto p-6 flex flex-col gap-6">
        {/* ── 입고 등록 폼 ── */}
        <div className="max-w-lg">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">입고 등록</p>
          <div className="border border-gray-200 rounded-lg p-4 bg-white flex flex-col gap-3">
            {/* 부품 선택 */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">부품 선택</label>
              <select
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value === '' ? '' : Number(e.target.value))}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">— 부품을 선택하세요 —</option>
                {summary.map((item) => (
                  <option key={item.inventoryItemId} value={item.inventoryItemId}>
                    [{item.tableName}] {getPartName(item)} (현재 재고: {item.stockQuantity}개)
                  </option>
                ))}
              </select>
            </div>

            {/* 수량 입력 */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">입고 수량</label>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder="수량을 입력하세요"
                className="px-3 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 w-40"
              />
            </div>

            {/* 등록 버튼 */}
            <div className="flex items-center gap-3">
              <Button
                variant="primary"
                size="sm"
                onClick={handleSubmit}
                disabled={!selectedItemId || !quantity || Number(quantity) <= 0 || inbound.isPending}
              >
                {inbound.isPending ? <Spinner className="w-3.5 h-3.5" /> : <PackagePlus className="w-3.5 h-3.5" />}
                입고 등록
              </Button>

              {/* 성공 메시지 */}
              {successMsg && (
                <span className="flex items-center gap-1.5 text-xs text-green-600">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {successMsg}
                </span>
              )}

              {/* 에러 메시지 */}
              {errorMsg && (
                <span className="text-xs text-red-500">{errorMsg}</span>
              )}
            </div>
          </div>
        </div>

        {/* ── 현재 재고 현황 ── */}
        <div className="flex-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            현재 재고 현황 ({summary.length}개 부품)
          </p>

          {isLoading ? (
            <div className="flex items-center gap-2 text-xs text-gray-400 py-2">
              <Spinner className="w-3.5 h-3.5" /> 불러오는 중...
            </div>
          ) : summary.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 border border-dashed border-gray-200 rounded-lg text-gray-400 bg-gray-50/50">
              <PackagePlus className="w-9 h-9 mb-3 text-gray-200" />
              <p className="text-sm text-gray-500 mb-1">등록된 부품이 없습니다</p>
              <p className="text-xs">테이블 관리에서 PARTS 테이블과 부품을 먼저 등록하세요.</p>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg overflow-auto">
              <table className="w-full text-sm border-collapse">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 border-r border-gray-100">
                      테이블
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 border-r border-gray-100">
                      부품명
                    </th>
                    {/* 동적 컬럼 헤더 — 첫 번째 아이템의 컬럼 기준 */}
                    {summary[0]?.values.map((v) => (
                      <th
                        key={v.columnId}
                        className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 border-r border-gray-100"
                      >
                        {v.columnName}
                      </th>
                    ))}
                    <th className="px-3 py-2.5 text-right text-xs font-medium text-blue-600">
                      현재 재고
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {summary.map((item) => (
                    <tr key={item.inventoryItemId} className="border-t border-gray-100 hover:bg-gray-50/60">
                      <td className="px-3 py-2.5 text-xs text-gray-500 border-r border-gray-100">
                        {item.tableName}
                      </td>
                      <td className="px-3 py-2.5 text-sm font-medium text-gray-800 border-r border-gray-100">
                        {getPartName(item)}
                      </td>
                      {item.values.map((v) => (
                        <td key={v.columnId} className="px-3 py-2.5 text-sm text-gray-700 border-r border-gray-100 truncate max-w-xs">
                          {v.value ?? ''}
                        </td>
                      ))}
                      <td className="px-3 py-2.5 text-sm font-semibold text-right text-blue-700">
                        {item.stockQuantity.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

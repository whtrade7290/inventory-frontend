import { BarChart2 } from 'lucide-react'
import { Spinner } from '../../../shared/ui/Spinner'
import { useStockSummary } from '../../../entities/stock'
import type { StockSummaryItem } from '../../../entities/stock'

/**
 * 테이블별 그룹핑 헬퍼
 * StockSummaryItem 배열을 tableId 기준으로 묶어 반환한다
 */
function groupByTable(items: StockSummaryItem[]): Map<number, StockSummaryItem[]> {
  const map = new Map<number, StockSummaryItem[]>()
  for (const item of items) {
    const group = map.get(item.tableId) ?? []
    group.push(item)
    map.set(item.tableId, group)
  }
  return map
}

/**
 * 재고 현황 페이지
 * PARTS 테이블별로 섹션을 나눠 부품별 현재 재고 수량을 표시한다
 * 재고가 0이면 행을 빨간색으로 강조한다
 */
export default function StockPage() {
  const { data: summary = [], isLoading } = useStockSummary()

  const grouped = groupByTable(summary)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── 툴바 ── */}
      <div className="flex items-center gap-2 px-5 py-2.5 border-b border-[#e0e0e0] bg-white shrink-0">
        <BarChart2 className="w-4 h-4 text-gray-400" />
        <h1 className="text-sm font-semibold text-gray-800">재고 현황</h1>
        {isLoading && <Spinner className="w-3.5 h-3.5" />}
        {!isLoading && (
          <span className="ml-1 text-xs text-gray-400">
            총 {summary.length}개 부품
          </span>
        )}
      </div>

      <div className="flex-1 overflow-auto p-6 flex flex-col gap-8">
        {isLoading ? (
          <div className="flex items-center gap-2 text-xs text-gray-400 py-2">
            <Spinner className="w-3.5 h-3.5" /> 불러오는 중...
          </div>
        ) : summary.length === 0 ? (
          /* 빈 상태 */
          <div className="flex flex-col items-center justify-center py-14 border border-dashed border-gray-200 rounded-lg text-gray-400 bg-gray-50/50">
            <BarChart2 className="w-9 h-9 mb-3 text-gray-200" />
            <p className="text-sm text-gray-500 mb-1">재고 데이터가 없습니다</p>
            <p className="text-xs">PARTS 테이블에 부품을 등록하고 입고 관리에서 수량을 추가하세요.</p>
          </div>
        ) : (
          /* 테이블별 섹션 */
          Array.from(grouped.entries()).map(([tableId, items]) => {
            const tableName = items[0].tableName

            /* 이 테이블 아이템들의 컬럼명 목록 (첫 번째 아이템 기준) */
            const columnNames = items[0]?.values.map((v) => v.columnName) ?? []

            /* 재고 0 카운트 */
            const outOfStock = items.filter((i) => i.stockQuantity === 0).length

            return (
              <div key={tableId}>
                {/* 섹션 헤더 */}
                <div className="flex items-center gap-2 mb-3">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    {tableName}
                  </p>
                  <span className="text-xs text-gray-400">({items.length}개 부품)</span>
                  {outOfStock > 0 && (
                    <span className="px-1.5 py-0.5 text-[11px] font-medium text-red-600 bg-red-50 border border-red-100 rounded">
                      재고 부족 {outOfStock}건
                    </span>
                  )}
                </div>

                {/* 재고 테이블 */}
                <div className="border border-gray-200 rounded-lg overflow-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 border-r border-gray-100 w-12">
                          #
                        </th>
                        {columnNames.map((name) => (
                          <th
                            key={name}
                            className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 border-r border-gray-100"
                          >
                            {name}
                          </th>
                        ))}
                        <th className="px-3 py-2.5 text-right text-xs font-medium text-blue-600 min-w-[80px]">
                          현재 재고
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, idx) => {
                        const isOut = item.stockQuantity === 0
                        return (
                          <tr
                            key={item.inventoryItemId}
                            className={`border-t border-gray-100 ${isOut ? 'bg-red-50/60' : 'hover:bg-gray-50/60'}`}
                          >
                            <td className="px-3 py-2.5 text-xs text-gray-400 border-r border-gray-100 text-center">
                              {idx + 1}
                            </td>
                            {item.values.map((v) => (
                              <td
                                key={v.columnId}
                                className="px-3 py-2.5 text-sm text-gray-700 border-r border-gray-100 truncate max-w-xs"
                              >
                                {v.value ?? ''}
                              </td>
                            ))}
                            <td
                              className={`px-3 py-2.5 text-sm font-semibold text-right ${
                                isOut ? 'text-red-600' : 'text-blue-700'
                              }`}
                            >
                              {isOut ? (
                                <span className="inline-flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                                  {item.stockQuantity.toLocaleString()}
                                </span>
                              ) : (
                                item.stockQuantity.toLocaleString()
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>

                    {/* 합계 행 */}
                    <tfoot className="bg-gray-50 border-t border-gray-200">
                      <tr>
                        <td
                          colSpan={1 + columnNames.length}
                          className="px-3 py-2 text-xs text-gray-500 border-r border-gray-100 text-right font-medium"
                        >
                          합계
                        </td>
                        <td className="px-3 py-2 text-sm font-bold text-right text-gray-800">
                          {items.reduce((sum, i) => sum + i.stockQuantity, 0).toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

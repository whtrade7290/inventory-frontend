import { BarChart2 } from 'lucide-react'

/** 재고 현황 페이지 — 구현 예정 (entities/stock, features/filter-records 조합) */
export default function StockPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <BarChart2 className="w-12 h-12 text-gray-200 mb-4" />
      <p className="text-gray-500 text-sm font-medium">재고 현황</p>
      <p className="text-gray-400 text-xs mt-1">준비 중입니다.</p>
    </div>
  )
}

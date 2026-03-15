import { PackageMinus } from 'lucide-react'

/** 출고 관리 페이지 — 구현 예정 (entities/outbound, features/register-outbound 조합) */
export default function OutboundPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <PackageMinus className="w-12 h-12 text-gray-200 mb-4" />
      <p className="text-gray-500 text-sm font-medium">출고 관리</p>
      <p className="text-gray-400 text-xs mt-1">준비 중입니다.</p>
    </div>
  )
}

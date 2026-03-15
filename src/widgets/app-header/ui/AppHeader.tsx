import { UserCircle } from 'lucide-react'

/**
 * 앱 상단 헤더 위젯
 * - 좌측: 앱 이름
 * - 우측: 회원 영역 (로그인 구현 시 UserMenu 컴포넌트로 교체)
 */
export function AppHeader() {
  return (
    <header className="flex items-center justify-between px-4 h-11 bg-white border-b border-[#e0e0e0] shrink-0 z-30">
      <span className="text-sm font-semibold text-gray-800">Inventory</span>

      {/* TODO: 로그인 구현 시 <UserMenu /> 로 교체 */}
      <button disabled
        className="flex items-center gap-2 px-2 py-1 rounded text-gray-400 cursor-default"
        title="로그인 기능 준비 중"
      >
        <UserCircle className="w-5 h-5" />
        <span className="text-xs">로그인</span>
      </button>
    </header>
  )
}

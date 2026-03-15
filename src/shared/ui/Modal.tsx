import { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '../lib/cn'

interface ModalProps {
  title: string
  onClose: () => void
  children: React.ReactNode
  className?: string
}

/**
 * 공통 모달 컴포넌트
 * - 오버레이 클릭 또는 × 버튼으로 닫기
 * - ESC 키로 닫기
 */
export function Modal({ title, onClose, children, className }: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onClick={onClose}
    >
      <div
        className={cn('bg-white rounded-lg shadow-xl p-5', className)}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

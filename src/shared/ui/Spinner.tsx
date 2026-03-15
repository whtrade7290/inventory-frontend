import { RefreshCw } from 'lucide-react'
import { cn } from '../lib/cn'

interface SpinnerProps { className?: string }

/** 로딩 스피너 */
export function Spinner({ className }: SpinnerProps) {
  return <RefreshCw className={cn('animate-spin text-gray-400', className)} />
}

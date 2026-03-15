import { Type, Hash, Calendar, ToggleLeft, Link } from 'lucide-react'
import type { DataType } from '../model/types'

const iconMap: Record<DataType, React.ElementType> = {
  TEXT: Type,
  NUMBER: Hash,
  DATE: Calendar,
  BOOLEAN: ToggleLeft,
  RELATION: Link,
}

interface TypeIconProps {
  dataType: DataType
  className?: string
}

/** 컬럼 타입에 해당하는 아이콘을 렌더링한다 */
export function TypeIcon({ dataType, className = 'w-3.5 h-3.5' }: TypeIconProps) {
  const Icon = iconMap[dataType] ?? Type
  return <Icon className={className} />
}

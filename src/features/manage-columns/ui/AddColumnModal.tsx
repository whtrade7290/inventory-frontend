import { useEffect, useState } from 'react'
import { Modal } from '../../../shared/ui/Modal'
import { Button } from '../../../shared/ui/Button'
import { TypeIcon } from '../../../entities/column'
import { useColumns } from '../../../entities/column'
import type { UserTable } from '../../../entities/user-table'
import type { DataType, CreateColumnDto } from '../../../entities/column'

const DATA_TYPES: { type: DataType; label: string; desc: string }[] = [
  { type: 'TEXT',     label: '텍스트',   desc: '짧은 텍스트 또는 긴 내용' },
  { type: 'NUMBER',   label: '숫자',     desc: '정수 또는 소수' },
  { type: 'DATE',     label: '날짜',     desc: '날짜 선택' },
  { type: 'BOOLEAN',  label: '체크박스', desc: '참/거짓 값' },
  { type: 'RELATION', label: '관계',     desc: '다른 테이블의 레코드 연결' },
]

interface AddColumnModalProps {
  currentTableId: number
  allTables: UserTable[]
  onConfirm: (dto: CreateColumnDto) => Promise<void>
  onClose: () => void
}

/**
 * 필드 추가 모달 (feature: manage-columns)
 * entities/column의 타입을 사용하고,
 * 확정 시 onConfirm 콜백으로 상위에 위임한다
 */
export function AddColumnModal({ currentTableId, allTables, onConfirm, onClose }: AddColumnModalProps) {
  const [name, setName] = useState('')
  const [dataType, setDataType] = useState<DataType>('TEXT')
  const [refTableId, setRefTableId] = useState<number | ''>('')
  const [refColumnId, setRefColumnId] = useState<number | ''>('')
  const [submitting, setSubmitting] = useState(false)

  const otherTables = allTables.filter((t) => t.id !== currentTableId)
  const { data: refColumns = [] } = useColumns(
    dataType === 'RELATION' && refTableId !== '' ? Number(refTableId) : 0
  )

  useEffect(() => { setRefColumnId('') }, [refTableId])

  const handleSubmit = async () => {
    if (!name.trim()) return
    setSubmitting(true)
    try {
      await onConfirm({
        name: name.trim(),
        dataType,
        refTableId: dataType === 'RELATION' && refTableId !== '' ? Number(refTableId) : undefined,
        refColumnId: dataType === 'RELATION' && refColumnId !== '' ? Number(refColumnId) : undefined,
      })
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal title="필드 추가" onClose={onClose} className="w-96">
      {/* 필드 이름 */}
      <div className="mb-4">
        <label className="text-xs text-gray-500 mb-1 block">필드 이름</label>
        <input autoFocus type="text" value={name} onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="이름 입력"
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* 타입 선택 */}
      <div className="mb-4">
        <label className="text-xs text-gray-500 mb-1 block">필드 유형</label>
        <div className="space-y-1">
          {DATA_TYPES.map(({ type, label, desc }) => (
            <button key={type} onClick={() => setDataType(type)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded text-left text-sm transition-colors
                ${dataType === type ? 'bg-blue-50 border border-blue-200 text-blue-700' : 'hover:bg-gray-50 border border-transparent text-gray-700'}`}
            >
              <TypeIcon dataType={type} className="w-4 h-4 shrink-0" />
              <div>
                <div className="font-medium leading-none">{label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* RELATION 참조 설정 */}
      {dataType === 'RELATION' && (
        <div className="mb-4 space-y-2 p-3 bg-gray-50 rounded border border-gray-200">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">참조 테이블</label>
            <select value={refTableId}
              onChange={(e) => setRefTableId(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">테이블 선택</option>
              {otherTables.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          {refColumns.length > 0 && (
            <div>
              <label className="text-xs text-gray-500 mb-1 block">표시할 필드</label>
              <select value={refColumnId}
                onChange={(e) => setRefColumnId(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">필드 선택</option>
                {refColumns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={onClose}>취소</Button>
        <Button variant="primary" size="sm" onClick={handleSubmit}
          disabled={!name.trim() || submitting}>추가</Button>
      </div>
    </Modal>
  )
}

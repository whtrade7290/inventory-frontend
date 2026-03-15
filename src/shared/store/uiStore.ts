import { create } from 'zustand'

/**
 * 전역 UI 상태 스토어 (Zustand)
 * 서버 데이터는 React Query가 담당하므로,
 * 여기서는 순수 UI 상태(화면 구조, 선택 상태)만 관리한다
 */
interface UIState {
  /** 현재 선택된 사용자 정의 테이블 ID */
  selectedTableId: number | null
  setSelectedTableId: (id: number | null) => void

  /** 사이드바 접힘 여부 (모바일 대응) */
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSidebar: () => void

  /** 미저장 테이블 이름 변경 — tableId → 변경된 이름 */
  dirtyTableNames: Record<number, string>
  setDirtyTableName: (id: number, name: string) => void
  clearDirtyTableName: (id: number) => void
}

export const useUIStore = create<UIState>((set) => ({
  selectedTableId: null,
  setSelectedTableId: (id) => set({ selectedTableId: id }),

  sidebarCollapsed: false,
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  dirtyTableNames: {},
  setDirtyTableName: (id, name) =>
    set((s) => ({ dirtyTableNames: { ...s.dirtyTableNames, [id]: name } })),
  clearDirtyTableName: (id) =>
    set((s) => {
      const next = { ...s.dirtyTableNames }
      delete next[id]
      return { dirtyTableNames: next }
    }),
}))

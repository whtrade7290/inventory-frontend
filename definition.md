# 프론트엔드 설계 문서

> 아키텍처: Feature-Sliced Design (FSD)
> 프레임워크: React + TypeScript
> 서버 상태: TanStack React Query v5
> UI 상태: Zustand
> 스타일: Tailwind CSS
> 버전: v1.1 | 2026.03.15

---

## 1. 아키텍처 개요

### Feature-Sliced Design (FSD)

레이어 간 의존 방향은 **단방향**이다. 상위 레이어만 하위 레이어를 import할 수 있다.

```
app → pages → widgets → features → entities → shared
```

각 레이어는 **슬라이스(도메인 단위)**로 나뉘고, 슬라이스 내부는 **세그먼트**로 구성된다.

```
슬라이스/
├── api/        API 호출 함수
├── model/      타입 정의 + React Query 훅 (+ Zustand 스토어)
├── ui/         React 컴포넌트
└── index.ts    퍼블릭 API (외부에 노출할 것만 re-export)
```

---

## 2. 폴더 구조

```
src/
├── app/
│   ├── providers/index.tsx     QueryClientProvider 등 전역 Provider 조합
│   └── router/index.tsx        AppShell(레이아웃) + Routes 정의
│
├── shared/                     도메인 무관 공통 인프라
│   ├── api/
│   │   ├── client.ts           axios 인스턴스 (JWT·테넌트 헤더 확장 자리 포함)
│   │   └── queryClient.ts      React Query 설정 + queryKeys 팩토리
│   ├── store/
│   │   └── uiStore.ts          Zustand (순수 UI 상태만 — 사이드바, 선택 테이블 등)
│   ├── ui/                     디자인 시스템 기본 컴포넌트 (Button, Modal, Spinner 등)
│   ├── lib/
│   │   └── cn.ts               Tailwind 클래스 병합 유틸
│   └── config/
│       └── constants.ts        그리드 너비 등 전역 상수
│
├── entities/                   도메인 데이터 단위 (서버 상태 포함)
│   ├── user-table/             사용자 정의 테이블
│   ├── column/                 컬럼 정의 (DataType, RELATION 포함) + TypeIcon
│   ├── inventory-item/         재고 항목 (EAV 셀 값)
│   ├── contractor/             시공업체
│   ├── site/                   현장 (시공업체 소속)
│   ├── inbound/                입고 기록
│   ├── outbound/               출고 기록
│   └── stock/                  재고 현황 (집계)
│
├── features/                   사용자 인터랙션 단위
│   ├── edit-inventory-item/    셀 인라인 편집 (useEditCell + GridCell)
│   ├── manage-columns/         필드 추가/삭제 (AddColumnModal)
│   ├── manage-user-table/      테이블 생성/삭제/이름 변경
│   ├── register-inbound/       입고 등록 폼 (구현 예정)
│   ├── register-outbound/      출고 등록 폼 (구현 예정)
│   └── filter-records/         필터/검색 패널 (구현 예정)
│
├── widgets/                    features + entities 조합 블록
│   ├── inventory-grid/         Airtable 스타일 스프레드시트 그리드
│   ├── app-sidebar/            사이드바 (고정 메뉴 + 테이블 목록)
│   └── app-header/             상단 헤더 (회원 영역 자리 포함)
│
└── pages/                      위젯 조합 + 뮤테이션 오케스트레이션
    ├── user-table/             EAV 테이블 그리드 페이지 (/tables/:id)
    ├── stock/                  재고 현황 (/stock)
    ├── inbound/                입고 관리 (/inbound)
    └── outbound/               출고 관리 (/outbound)
```

---

## 3. 상태 관리 전략

### React Query — 서버 상태 전담

모든 API 데이터는 React Query가 관리한다. 캐싱·무효화·로딩 처리가 자동화된다.

```ts
// 패턴: entities/{도메인}/model/use{Domain}.ts
export function useInventoryItems(tableId: number) {
  return useQuery({
    queryKey: queryKeys.inventoryItems.byTable(tableId),
    queryFn: () => inventoryItemApi.getByTable(tableId),
  })
}

export function useUpdateInventoryItem(tableId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ itemId, dto }) => inventoryItemApi.update(tableId, itemId, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.inventoryItems.byTable(tableId) }),
  })
}
```

**쿼리 키 팩토리** (`shared/api/queryClient.ts`):
- 중앙에서 관리해 일관된 무효화를 보장한다
- `queryKeys.inventoryItems.byTable(tableId)` 형태로 계층적 구조

### Zustand — 순수 UI 상태 전담

서버 데이터는 절대 Zustand에 담지 않는다. UI 구조에 관한 상태만 관리한다.
단, 컴포넌트 경계를 넘어야 하는 **미저장 변경(dirty state)** 은 예외적으로 uiStore에서 공유한다.

```ts
// shared/store/uiStore.ts
interface UIState {
  selectedTableId: number | null          // 현재 선택된 테이블
  sidebarCollapsed: boolean               // 사이드바 접힘 (모바일 대응)
  dirtyTableNames: Record<number, string> // 미저장 테이블 이름 (사이드바↔페이지 공유)
}
```

### 저장 버튼 패턴 (dirty state)

모든 변경은 즉시 서버에 저장하지 않고 로컬 dirty state에만 저장된다.
저장 버튼 클릭 시 일괄 반영한다.

| 변경 종류 | dirty state 위치 | 저장 시 호출 API |
|-----------|-----------------|-----------------|
| 셀 값 | `UserTablePage.dirtyItems` | `PUT /items/{id}` |
| 컬럼 이름 | `UserTablePage.dirtyColumnNames` | `PATCH /columns/{id}` |
| 컬럼 순서 | `UserTablePage.columnOrder` | `PATCH /columns/reorder` |
| 테이블 이름 | `uiStore.dirtyTableNames` | `PATCH /tables/{id}` |

- dirty 항목은 `bg-amber-50` 배경으로 표시
- dirty가 없을 때 저장 버튼 비활성화
- `displayColumns` / `displayItems`: 서버 데이터에 dirty overlay를 적용한 표시용 데이터 (이전 변경이 다음 편집에도 보존됨)

---

## 4. 라우팅

| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/` | → `/stock` 리다이렉트 | |
| `/stock` | StockPage | 재고 현황 |
| `/inbound` | InboundPage | 입고 관리 |
| `/outbound` | OutboundPage | 출고 관리 |
| `/tables/:id` | UserTablePage | EAV 테이블 그리드 |

모든 라우트는 `AppShell`(헤더 + 사이드바 + `<Outlet />`)을 공유한다.

---

## 5. 도메인별 엔티티 타입 요약

### user-table
```ts
interface UserTable { id, name, createdAt, updatedAt }
```

### column
```ts
type DataType = 'TEXT' | 'NUMBER' | 'DATE' | 'BOOLEAN' | 'RELATION'
interface Column { id, tableId, name, dataType, colOrder, refTableId?, refColumnId? }
```

### inventory-item (EAV)
```ts
interface InventoryItem { id, tableId, values: ItemValue[], createdAt, updatedAt }
interface ItemValue { columnId, value, displayValue? }  // RELATION이면 displayValue에 해석값
```

### contractor / site
```ts
interface Contractor { id, name }
interface Site { id, name, contractorId, contractorName }
```

### inbound / outbound
```ts
interface InboundRecord  { id, partId, quantity, supplier, inboundDate }
interface OutboundRecord { id, partId, quantity, contractorId, siteId, outboundDate }
```

### stock
```ts
interface StockStatus { partId, currentQuantity, minQuantity, isLow, totalInbound, totalOutbound }
```

---

## 6. 핵심 컴포넌트 의존 관계

```
pages/user-table/UserTablePage         ← dirty state 오케스트레이션 (셀/컬럼/순서/테이블명)
  └── widgets/inventory-grid/InventoryGrid
        ├── features/edit-inventory-item/GridCell        (셀 렌더링 + 편집 UI, isDirty prop)
        ├── features/edit-inventory-item/useEditCell     (편집 상태 로직, 동기 commit)
        ├── features/edit-inventory-item/RelationCellInput (RELATION 드롭다운)
        └── entities/column/TypeIcon                     (타입 아이콘)
        └── SortableColumnHeader (dnd-kit, 인라인 rename)

  └── features/manage-columns/AddColumnModal
        ├── entities/column/TypeIcon
        └── entities/column/useColumns                   (RELATION 참조 컬럼 목록)

widgets/app-sidebar/AppSidebar
  └── entities/user-table/useUserTables                  (테이블 목록)
  └── entities/user-table/useCreateUserTable
  └── entities/user-table/useDeleteUserTable
  └── shared/store/uiStore                               (dirtyTableNames 읽기/쓰기)
```

---

## 7. 향후 확장 포인트

### SaaS 멀티테넌시
- `shared/api/client.ts` 인터셉터에 `X-Tenant-ID` 헤더 주입
- 모든 API 함수가 client를 공유하므로 한 곳만 수정하면 적용

### 모바일 앱 (React Native)
- `entities/*/model/` (타입 + React Query 훅) — 플랫폼 무관
- `features/*/model/` (비즈니스 로직 훅) — 플랫폼 무관
- UI 컴포넌트(`shared/ui/`, `widgets/`, `features/ui/`)만 RN용으로 교체
- 모노레포 구성 시 model 레이어 공유 가능

### AI 기능
- `features/natural-language-search/` — 자연어 검색 인터페이스
- `features/photo-recognition/` — 사진으로 부품 식별 (Claude Vision API)
- 신규 feature 슬라이스로 추가하므로 기존 코드 영향 없음

---

_v1.0: FSD 아키텍처 초기 설계 (2026.03.15)_
_v1.1: 컬럼 D&D, 테이블/컬럼 이름 변경, 저장 버튼 패턴(dirty state) 추가 (2026.03.15)_

# Inventory Frontend

재고관리 시스템의 프론트엔드 애플리케이션입니다.
Airtable 스타일의 스프레드시트 UI로 사용자 정의 테이블을 관리합니다.

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| 프레임워크 | React 19 + TypeScript |
| 빌드 도구 | Vite 8 |
| 스타일 | Tailwind CSS 4 |
| 서버 상태 | TanStack React Query v5 |
| UI 상태 | Zustand v5 |
| 라우팅 | React Router v7 |
| HTTP 클라이언트 | Axios |
| 드래그 앤 드롭 | dnd-kit |
| 아이콘 | Lucide React |
| 아키텍처 | Feature-Sliced Design (FSD) |

---

## 시작하기

### 사전 조건

- Node.js 18+
- 백엔드 서버 실행 중 (`localhost:8080`)

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 시작 (localhost:5173)
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 결과 미리보기
npm run preview
```

### 백엔드 연결

`vite.config.ts`의 프록시 설정에 의해 `/api` 요청은 자동으로 `localhost:8080`으로 전달됩니다.
백엔드 포트를 변경했다면 `vite.config.ts`의 proxy 대상을 수정하세요.

---

## 주요 기능

### 테이블 관리
- 사용자 정의 테이블 생성 / 삭제
- 사이드바 테이블명 더블클릭으로 이름 변경

### 필드(컬럼) 관리
- 필드 추가 (TEXT / NUMBER / DATE / BOOLEAN / RELATION 타입)
- RELATION 타입: 다른 테이블의 컬럼을 참조
- 헤더 드래그 앤 드롭으로 필드 순서 변경
- 헤더 드롭다운에서 필드 이름 변경 / 삭제

### 레코드(행) 관리
- 레코드 추가 / 삭제
- 셀 클릭으로 인라인 편집 (Enter 확정 / ESC 취소 / Tab 다음 셀 이동)
- RELATION 셀: 참조 테이블 아이템 드롭다운 선택

### 저장 버튼 패턴
모든 변경사항은 즉시 서버에 저장되지 않고 **로컬 dirty state**에 보관됩니다.

- 변경된 셀 / 필드 헤더는 **노란 배경(`amber-50`)** 으로 표시
- 툴바 우측 **저장 버튼** 클릭 시 서버에 일괄 반영
- dirty 변경이 없으면 저장 버튼 비활성화

---

## 프로젝트 구조

FSD(Feature-Sliced Design) 아키텍처를 따릅니다.
레이어 간 의존 방향은 단방향입니다: `app → pages → widgets → features → entities → shared`

```
src/
├── app/
│   ├── providers/        QueryClientProvider 등 전역 Provider
│   └── router/           AppShell 레이아웃 + 라우트 정의
│
├── shared/               도메인 무관 공통 인프라
│   ├── api/              axios 클라이언트, React Query 설정, queryKeys
│   ├── store/            Zustand uiStore (UI 상태 + dirtyTableNames)
│   ├── ui/               공통 컴포넌트 (Button, Modal, Spinner)
│   ├── lib/              유틸 함수 (cn)
│   └── config/           전역 상수 (그리드 너비 등)
│
├── entities/             도메인 단위 서버 상태
│   ├── user-table/       테이블 타입 · API · React Query 훅
│   ├── column/           컬럼 타입 · API · 훅 · TypeIcon 컴포넌트
│   └── inventory-item/   아이템(EAV) 타입 · API · 훅
│
├── features/             사용자 인터랙션 단위
│   ├── edit-inventory-item/   셀 인라인 편집 (useEditCell, GridCell, RelationCellInput)
│   └── manage-columns/        필드 추가 모달 (AddColumnModal)
│
├── widgets/              features + entities 조합 UI 블록
│   ├── inventory-grid/   Airtable 스타일 그리드 (dnd-kit 컬럼 D&D 포함)
│   ├── app-sidebar/      사이드바 (테이블 목록 · 생성 · 삭제 · 이름변경)
│   └── app-header/       상단 헤더 (회원 영역 자리 포함)
│
└── pages/                위젯 조합 + 뮤테이션 오케스트레이션
    ├── user-table/        EAV 테이블 그리드 페이지 (/tables/:id)
    ├── stock/             재고 현황 (/stock) — 구현 예정
    ├── inbound/           입고 관리 (/inbound) — 구현 예정
    └── outbound/          출고 관리 (/outbound) — 구현 예정
```

자세한 설계 내용은 [`definition.md`](./definition.md)를 참고하세요.

---

## 라우트

| 경로 | 페이지 |
|------|--------|
| `/` | `/stock` 리다이렉트 |
| `/stock` | 재고 현황 (구현 예정) |
| `/inbound` | 입고 관리 (구현 예정) |
| `/outbound` | 출고 관리 (구현 예정) |
| `/tables/:id` | 사용자 정의 테이블 그리드 |

---

## 백엔드 API 연동

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/tables` | 테이블 목록 조회 |
| POST | `/api/tables` | 테이블 생성 |
| PATCH | `/api/tables/{id}` | 테이블 이름 변경 |
| DELETE | `/api/tables/{id}` | 테이블 삭제 |
| GET | `/api/tables/{id}/columns` | 컬럼 목록 조회 |
| POST | `/api/tables/{id}/columns` | 컬럼 추가 |
| PATCH | `/api/tables/{id}/columns/{columnId}` | 컬럼 이름 변경 |
| PATCH | `/api/tables/{id}/columns/reorder` | 컬럼 순서 일괄 변경 |
| DELETE | `/api/tables/{id}/columns/{columnId}` | 컬럼 삭제 |
| GET | `/api/tables/{id}/items` | 아이템 목록 조회 |
| POST | `/api/tables/{id}/items` | 아이템 추가 |
| PUT | `/api/tables/{id}/items/{itemId}` | 아이템 수정 |
| DELETE | `/api/tables/{id}/items/{itemId}` | 아이템 삭제 |

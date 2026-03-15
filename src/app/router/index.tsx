import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AppHeader } from '../../widgets/app-header/ui/AppHeader'
import { AppSidebar } from '../../widgets/app-sidebar/ui/AppSidebar'
import UserTablePage from '../../pages/user-table/ui/UserTablePage'
import StockPage from '../../pages/stock/ui/StockPage'
import InboundPage from '../../pages/inbound/ui/InboundPage'
import OutboundPage from '../../pages/outbound/ui/OutboundPage'

/**
 * 앱 레이아웃 Shell
 * - 헤더 + 사이드바는 모든 라우트에서 공통으로 렌더링된다
 * - 각 페이지는 <Outlet />에 렌더링된다
 */
function AppShell() {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <AppHeader />
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

/** 라우팅 정의 */
export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppShell />}>
          <Route index element={<Navigate to="/stock" replace />} />
          <Route path="stock"        element={<StockPage />} />
          <Route path="inbound"      element={<InboundPage />} />
          <Route path="outbound"     element={<OutboundPage />} />
          <Route path="tables/:id"   element={<UserTablePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

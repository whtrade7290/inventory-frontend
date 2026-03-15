import { AppProviders } from './app/providers'
import { AppRouter } from './app/router'

/**
 * 앱 루트
 * Provider → Router 순서로 감싼다
 */
export default function App() {
  return (
    <AppProviders>
      <AppRouter />
    </AppProviders>
  )
}

import { AuthBootstrap } from './components/AuthBootstrap'
import { AppErrorBoundary } from './components/AppErrorBoundary'
import { AppRouter } from './routes/AppRouter'

function App() {
  return (
    <AppErrorBoundary>
      <AuthBootstrap>
        <AppRouter />
      </AuthBootstrap>
    </AppErrorBoundary>
  )
}

export default App

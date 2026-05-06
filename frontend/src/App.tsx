import type { ReactNode } from 'react'
import { Provider } from 'react-redux'
import { Navigate, Route, Routes } from 'react-router-dom'
import { store } from './store'
import ChatPage from './pages/ChatPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import { useSelector } from 'react-redux'
import type { RootState } from './store'

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated)
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

function App() {
  return (
    <Provider store={store}>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Provider>
  )
}

export default App
import { Navigate, Route, Routes } from 'react-router'
import AuthProvider from './features/auth/AuthProvider.jsx'
import GuestRoute from './features/auth/GuestRoute.jsx'
import LoginPage from './features/auth/LoginPage.jsx'
import ProtectedRoute from './features/auth/ProtectedRoute.jsx'
import HomePage from './features/home/HomePage.jsx'
import './App.css'

// The router itself is provided by main.jsx (BrowserRouter) or by the tests (MemoryRouter).
function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route
          path="/connexion"
          element={
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App

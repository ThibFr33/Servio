import { Navigate, Route, Routes } from 'react-router'
import AuthProvider from './features/auth/AuthProvider.jsx'
import GuestRoute from './features/auth/GuestRoute.jsx'
import LoginPage from './features/auth/LoginPage.jsx'
import ProtectedRoute from './features/auth/ProtectedRoute.jsx'
import RoleRoute from './features/auth/RoleRoute.jsx'
import { ROLES } from './features/auth/roles.js'
import HomePage from './features/home/HomePage.jsx'
import LandingPage from './features/landing/LandingPage.jsx'
import AppLayout from './features/layout/AppLayout.jsx'
import PositionsPage from './features/positions/PositionsPage.jsx'
import TeamPage from './features/team/TeamPage.jsx'
import { ROUTES } from './routes.js'
import './App.css'

// The router itself is provided by main.jsx (BrowserRouter) or by the tests (MemoryRouter).
function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path={ROUTES.landing} element={<LandingPage />} />
        <Route
          path={ROUTES.login}
          element={
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          }
        />
        {/* Every page of the app shares AppLayout, which shows it in its <Outlet />. */}
        <Route
          path={ROUTES.app}
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<HomePage />} />
          <Route
            path={ROUTES.positions}
            element={
              <RoleRoute role={ROLES.admin}>
                <PositionsPage />
              </RoleRoute>
            }
          />
          <Route
            path={ROUTES.team}
            element={
              <RoleRoute role={ROLES.admin}>
                <TeamPage />
              </RoleRoute>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to={ROUTES.landing} replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App

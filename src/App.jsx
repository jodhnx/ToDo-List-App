import { Suspense, lazy } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { ToastProvider } from './context/ToastContext'
import ProtectedRoute from './components/layout/ProtectedRoute'
import AppShell from './components/layout/AppShell'
import Landing from './pages/Landing'
import AuthPage from './pages/AuthPage'
import ErrorBoundary from './components/ErrorBoundary'
import { PageLoader } from './components/ui/Skeleton'

const HomePage = lazy(() => import('./pages/HomePage'))
const TasksPage = lazy(() => import('./pages/TasksPage'))
const ShoppingPage = lazy(() => import('./pages/ShoppingPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const FamilyPage = lazy(() => import('./pages/FamilyPage'))
const GroupDetailPage = lazy(() => import('./pages/GroupDetailPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'))

function LazyPage({ children }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <ThemeProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route
                  path="/app"
                  element={
                    <ProtectedRoute>
                      <AppShell />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<LazyPage><HomePage /></LazyPage>} />
                  <Route path="tasks" element={<LazyPage><TasksPage /></LazyPage>} />
                  <Route path="shopping" element={<LazyPage><ShoppingPage /></LazyPage>} />
                  <Route path="family" element={<LazyPage><FamilyPage /></LazyPage>} />
                  <Route path="family/:groupId" element={<LazyPage><GroupDetailPage /></LazyPage>} />
                  <Route path="profile" element={<LazyPage><ProfilePage /></LazyPage>} />
                  <Route path="notifications" element={<LazyPage><NotificationsPage /></LazyPage>} />
                  <Route path="settings" element={<LazyPage><SettingsPage /></LazyPage>} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </ThemeProvider>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  )
}

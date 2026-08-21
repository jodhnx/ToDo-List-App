import { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { ToastProvider } from './context/ToastContext'
import ProtectedRoute from './components/layout/ProtectedRoute'
import AppShell from './components/layout/AppShell'
import Landing from './pages/Landing'
import AuthPage from './pages/AuthPage'
import ErrorBoundary from './components/ErrorBoundary'
import { PageLoader } from './components/ui/Skeleton'

// Hauptmenüs synchron laden → kein Suspense-Flash beim Tab-Wechsel
import HomePage from './pages/HomePage'
import TasksPage from './pages/TasksPage'
import ShoppingPage from './pages/ShoppingPage'
import FamilyPage from './pages/FamilyPage'
import SettingsPage from './pages/SettingsPage'

const GroupDetailPage = lazy(() => import('./pages/GroupDetailPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'))

/** Sekundäre Seiten: Suspense nur hier, Fallback ohne Layout-Sprung */
function SoftSuspense({ children }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>
}

/** Prefetch seltener Routen im Hintergrund nach dem ersten App-Render */
function PrefetchSecondaryRoutes() {
  useEffect(() => {
    const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 800))
    const id = idle(() => {
      void import('./pages/GroupDetailPage')
      void import('./pages/ProfilePage')
      void import('./pages/NotificationsPage')
    })
    return () => {
      if (window.cancelIdleCallback) window.cancelIdleCallback(id)
      else clearTimeout(id)
    }
  }, [])
  return null
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <ThemeProvider>
            <BrowserRouter>
              <ScrollToTop />
              <PrefetchSecondaryRoutes />
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
                  <Route index element={<HomePage />} />
                  <Route path="tasks" element={<TasksPage />} />
                  <Route path="shopping" element={<ShoppingPage />} />
                  <Route path="family" element={<FamilyPage />} />
                  <Route
                    path="family/:groupId"
                    element={
                      <SoftSuspense>
                        <GroupDetailPage />
                      </SoftSuspense>
                    }
                  />
                  <Route
                    path="profile"
                    element={
                      <SoftSuspense>
                        <ProfilePage />
                      </SoftSuspense>
                    }
                  />
                  <Route
                    path="notifications"
                    element={
                      <SoftSuspense>
                        <NotificationsPage />
                      </SoftSuspense>
                    }
                  />
                  <Route path="settings" element={<SettingsPage />} />
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

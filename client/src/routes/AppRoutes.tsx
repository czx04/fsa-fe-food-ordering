import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import { ProtectedLayout } from '../layouts/ProtectedLayout'
import { PublicLayout } from '../layouts/PublicLayout'
import { AdminDashboard } from '../pages/AdminDashboard'
import { Home } from '../pages/Home'
import { Login } from '../pages/Login'
import NotFoundPage from '../pages/NotFoundPage'
import { OwnerDashboard } from '../pages/OwnerDashboard'

function AppRoutes() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/login" element={<Login />} />
          </Route>

          <Route element={<ProtectedLayout />}>
            <Route path="/home" element={<Home />} />
          </Route>

          <Route element={<ProtectedLayout allowedRoles={['admin']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>

          <Route element={<ProtectedLayout allowedRoles={['restaurant_owner']} />}>
            <Route path="/owner" element={<OwnerDashboard />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default AppRoutes

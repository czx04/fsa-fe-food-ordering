import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { PublicLayout } from './layouts/PublicLayout'
import { ProtectedLayout } from './layouts/ProtectedLayout'
import { Login } from './pages/Login'
import { Home } from './pages/Home'
import { AdminDashboard } from './pages/AdminDashboard'
import { OwnerDashboard } from './pages/OwnerDashboard'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Navigate to="/home" />} />
            <Route path="/login" element={<Login />} />
          </Route>

          {/* Protected Routes for Everyone */}
          <Route element={<ProtectedLayout />}>
            <Route path="/home" element={<Home />} />
          </Route>
          
          {/* Protected Routes for Admin */}
          <Route element={<ProtectedLayout allowedRoles={['admin']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>

          {/* Protected Routes for Restaurant Owner */}
          <Route element={<ProtectedLayout allowedRoles={['restaurant_owner']} />}>
            <Route path="/owner" element={<OwnerDashboard />} />
          </Route>

          {/* Fallback 404 */}
          <Route path="*" element={<div style={{ padding: 50, textAlign: 'center' }}><h2>404 - Not Found</h2></div>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App

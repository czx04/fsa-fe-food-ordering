import { useEffect, useState, useRef } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { api } from '../utils/api'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export const VerifyEmail = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const hasFetched = useRef(false)
  const { refreshUser, isAuthenticated } = useAuth()

  useEffect(() => {
    if (!token) {
      setError('Mã xác nhận không tồn tại trong liên kết.')
      setLoading(false)
      return
    }

    if (hasFetched.current) return
    hasFetched.current = true

    api
      .get(`/auth/verify-email?token=${token}`)
      .then(async (res) => {
        setMessage(res.data.message || 'Xác thực email thành công!')
        setError('')
        if (isAuthenticated) {
          // Refresh user context immediately so UI updates to 'active' status
          await refreshUser()
        }
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Link xác thực không hợp lệ hoặc đã hết hạn.')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [token, isAuthenticated, refreshUser])

  return (
    <div className="section">
      <div className="container" style={{ maxWidth: '520px' }}>
        <div className="surface center" style={{ padding: '40px 24px' }}>
          {loading && (
            <div>
              <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
              <h2>Đang xác thực email...</h2>
              <p className="muted">Vui lòng chờ trong giây lát.</p>
            </div>
          )}

          {!loading && message && (
            <div>
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
              <h2 className="text-emerald-600 mb-2">Xác thực thành công!</h2>
              <p className="muted mb-6">{message}</p>
              <Link to="/login" className="btn" style={{ textDecoration: 'none' }}>
                Đăng nhập ngay
              </Link>
            </div>
          )}

          {!loading && error && (
            <div>
              <XCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
              <h2 className="text-rose-600 mb-2">Xác thực thất bại</h2>
              <p className="muted mb-6">{error}</p>
              <div className="flex gap-4 justify-center">
                <Link to="/login" className="btn btn-outline" style={{ textDecoration: 'none' }}>
                  Quay lại Đăng nhập
                </Link>
                <Link to="/register" className="btn" style={{ textDecoration: 'none' }}>
                  Tạo tài khoản mới
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

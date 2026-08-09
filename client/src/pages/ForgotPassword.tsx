import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../utils/api'
import { Button } from '../components/ui/Button'
import { AlertCircle, CheckCircle2, KeyRound, Info } from 'lucide-react'

export const ForgotPassword = () => {
  const [step, setStep] = useState<1 | 2>(1)
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [demoToken, setDemoToken] = useState('')

  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    try {
      const res = await api.post('/auth/forgot-password', { email })
      setSuccess('Mã xác nhận đã được khởi tạo!')
      if (res.data.resetToken) {
        setDemoToken(res.data.resetToken)
        setToken(res.data.resetToken)
      }
      setStep(2)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng kiểm tra email.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu nhập lại không khớp.')
      return
    }

    setIsLoading(true)

    try {
      const res = await api.post('/auth/reset-password', {
        email,
        token,
        newPassword,
      })
      setSuccess(res.data.message || 'Đặt lại mật khẩu thành công!')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đặt lại mật khẩu thất bại.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-[#f7faf7] text-[#17201a]">
      <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-3xl shadow-sm border border-[#e7ece8]">
        <Link to="/login" className="text-xs font-bold text-[#ff5a1f] hover:underline inline-block mb-4">
          ← Quay lại đăng nhập
        </Link>

        <div className="flex items-center gap-2 mb-1">
          <KeyRound className="w-5 h-5 text-[#ff5a1f]" />
          <h1 className="text-2xl font-bold text-[#17201a] tracking-tight">
            {step === 1 ? 'Quên mật khẩu' : 'Đặt lại mật khẩu mới'}
          </h1>
        </div>
        <p className="text-xs text-[#68736c] mt-1 mb-6">
          {step === 1 
            ? 'Nhập địa chỉ email của bạn để nhận mã xác nhận.' 
            : 'Nhập mã xác nhận (6 chữ số) và mật khẩu mới.'}
        </p>

        {error && (
          <div className="p-4 mb-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 mb-4 rounded-xl bg-[#fff0e9] border border-[#ff5a1f]/30 text-[#ff5a1f] text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#ff5a1f]" />
            <span>{success}</span>
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleRequestToken} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#68736c] mb-1.5">
                Email tài khoản
              </label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="w-full px-4 py-3 rounded-xl border border-[#e7ece8] focus:border-[#ff5a1f] focus:ring-4 focus:ring-[#ff5a1f]/10 outline-none transition text-[#17201a] text-xs bg-[#f7faf7] focus:bg-white"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              variant="primary"
              size="lg"
              fullWidth
            >
              {isLoading ? 'Đang gửi...' : 'Gửi mã xác nhận'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            {demoToken && (
              <div className="p-3 bg-[#fff0e9] border border-[#ff5a1f]/20 rounded-xl text-[#ff5a1f] text-xs flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0 text-[#ff5a1f]" />
                <span><b>Mã xác nhận (Demo/Test):</b> <code className="font-bold">{demoToken}</code></span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#68736c] mb-1.5">
                Mã xác nhận (OTP)
              </label>
              <input 
                type="text" 
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="123456"
                required
                className="w-full px-4 py-3 rounded-xl border border-[#e7ece8] focus:border-[#ff5a1f] focus:ring-4 focus:ring-[#ff5a1f]/10 outline-none transition text-[#17201a] text-xs bg-[#f7faf7] focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#68736c] mb-1.5">
                Mật khẩu mới
              </label>
              <input 
                type="password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 rounded-xl border border-[#e7ece8] focus:border-[#ff5a1f] focus:ring-4 focus:ring-[#ff5a1f]/10 outline-none transition text-[#17201a] text-xs bg-[#f7faf7] focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#68736c] mb-1.5">
                Nhập lại mật khẩu mới
              </label>
              <input 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 rounded-xl border border-[#e7ece8] focus:border-[#ff5a1f] focus:ring-4 focus:ring-[#ff5a1f]/10 outline-none transition text-[#17201a] text-xs bg-[#f7faf7] focus:bg-white"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              variant="primary"
              size="lg"
              fullWidth
            >
              {isLoading ? 'Đang cập nhật...' : 'Đổi mật khẩu'}
            </Button>
          </form>
        )}
      </div>
    </main>
  )
}

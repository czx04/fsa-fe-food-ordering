import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../utils/api'
import { ShoppingBag, Store, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import { HOME_PROMOTION_IMAGE_URL } from '../utils/constants'

export const Register = () => {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [role, setRole] = useState<'customer' | 'restaurant_owner'>('customer')
  
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const navigate = useNavigate()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (password !== confirmPassword) {
      setError('Mật khẩu nhập lại không khớp.')
      return
    }

    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.')
      return
    }

    setIsLoading(true)

    try {
      const res = await api.post('/auth/register', {
        fullName,
        email,
        phone,
        password,
        role,
      })

      setSuccess(res.data.message || 'Đăng ký thành công! Đang chuyển hướng sang trang đăng nhập...')
      setTimeout(() => {
        navigate('/login')
      }, 1500)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đăng ký thất bại, vui lòng thử lại.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 bg-slate-50/50 text-slate-800">
      {/* Left Artwork Section */}
      <section className="hidden lg:flex flex-col justify-center p-12 bg-orange-500 text-white relative overflow-hidden min-h-[80vh]">
        {/* Center Content */}
        <div className="relative z-10 max-w-md mx-auto text-center py-8">
          <div className="relative inline-block mb-8 group">
            <img 
              src={HOME_PROMOTION_IMAGE_URL} 
              alt="Đăng ký thành viên" 
              className="relative w-72 h-72 object-cover rounded-3xl shadow-xl mx-auto border-4 border-white/20 transform group-hover:scale-[1.02] transition duration-300"
            />
          </div>
          <h2 className="text-3xl font-bold mb-3 tracking-tight">Gia nhập gia đình MămMăm</h2>
          <p className="text-orange-100 text-base leading-relaxed">
            Nhận ưu đãi độc quyền giảm 20% cho đơn hàng đầu tiên và nhiều khuyến mãi hấp dẫn mỗi tuần.
          </p>
        </div>
      </section>
      
      {/* Right Form Section */}
      <section className="flex items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-md space-y-6 bg-white p-8 sm:p-10 rounded-3xl shadow-sm border border-slate-100">
          {/* Header Mobile Brand */}
          <div>
            <Link to="/" className="lg:hidden text-2xl font-black text-orange-600 block mb-4">
              MămMăm.
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Tạo tài khoản mới
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Điền thông tin bên dưới để bắt đầu đặt món ngay.
            </p>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-sm font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-green-600 text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-green-500" />
              <span>{success}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleRegister}>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Họ và tên
              </label>
              <input 
                type="text" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nguyễn Văn A"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition text-slate-800 text-sm bg-slate-50/50 focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Email
                </label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition text-slate-800 text-sm bg-slate-50/50 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Số điện thoại
                </label>
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0912345678"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition text-slate-800 text-sm bg-slate-50/50 focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Mật khẩu
                </label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition text-slate-800 text-sm bg-slate-50/50 focus:bg-white pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Nhập lại mật khẩu
                </label>
                <div className="relative">
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition text-slate-800 text-sm bg-slate-50/50 focus:bg-white pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                    aria-label={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Loại tài khoản
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('customer')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                    role === 'customer' 
                      ? 'border-orange-500 bg-orange-50 text-orange-600 shadow-sm' 
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" /> Khách hàng
                </button>
                <button
                  type="button"
                  onClick={() => setRole('restaurant_owner')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                    role === 'restaurant_owner' 
                      ? 'border-orange-500 bg-orange-50 text-orange-600 shadow-sm' 
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Store className="w-4 h-4" /> Chủ nhà hàng
                </button>
              </div>
            </div>
            
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl shadow-sm transition text-sm disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
            </button>
            
            <p className="text-center text-xs text-slate-500 pt-3 border-t border-slate-100">
              Đã có tài khoản?{' '}
              <Link to="/login" className="font-bold text-orange-600 hover:text-orange-700 transition">
                Đăng nhập ngay
              </Link>
            </p>
          </form>
        </div>
      </section>
    </div>
  )
}

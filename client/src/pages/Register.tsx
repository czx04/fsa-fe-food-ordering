import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../utils/api'
import { ShoppingBag, Store, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '../components/ui/Button'

export const Register = () => {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
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
    <div className="grid grid-cols-1 lg:grid-cols-2 bg-[#f7faf7] text-[#17201a] min-h-[calc(100vh-64px)]">
      {/* Left Artwork Section */}
      <section className="hidden lg:flex flex-col justify-center p-12 bg-[#fff0e9] text-[#17201a] relative overflow-hidden">
        {/* Center Content */}
        <div className="relative z-10 max-w-md mx-auto text-center py-8">
          <div className="relative inline-block mb-8">
            <img 
              src="/assets/chicken.jpg" 
              alt="Đăng ký thành viên" 
              className="relative w-72 h-72 object-cover rounded-3xl shadow-md mx-auto border-4 border-white"
            />
          </div>
          <span className="mb-2 text-[11px] font-extrabold uppercase tracking-[.12em] text-[#ff5a1f] block">
            Trải nghiệm ẩm thực tuyệt vời
          </span>
          <h2 className="text-3xl font-bold mb-3 tracking-tight text-[#17201a]">Gia nhập gia đình MămMăm</h2>
          <p className="text-[#68736c] text-sm leading-relaxed">
            Nhận ưu đãi độc quyền giảm 20% cho đơn hàng đầu tiên và nhiều khuyến mãi hấp dẫn mỗi tuần.
          </p>
        </div>
      </section>
      
      {/* Right Form Section */}
      <section className="flex items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-md space-y-6 bg-white p-8 sm:p-10 rounded-3xl shadow-sm border border-[#e7ece8]">
          {/* Header Mobile Brand */}
          <div>
            <Link to="/" className="lg:hidden text-2xl font-black text-[#ff5a1f] block mb-4">
              MămMăm<span className="text-[#ff5a1f]">.</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#17201a] tracking-tight">
              Tạo tài khoản mới
            </h1>
            <p className="text-[#68736c] text-xs mt-1">
              Điền thông tin bên dưới để bắt đầu đặt món ngay.
            </p>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-4 rounded-xl bg-[#fff0e9] border border-[#ff5a1f]/30 text-[#ff5a1f] text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#ff5a1f]" />
              <span>{success}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleRegister}>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#68736c] mb-1.5">
                Họ và tên
              </label>
              <input 
                type="text" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nguyễn Văn A"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-[#e7ece8] focus:border-[#ff5a1f] focus:ring-4 focus:ring-[#ff5a1f]/10 outline-none transition text-[#17201a] text-xs bg-[#f7faf7] focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#68736c] mb-1.5">
                  Email
                </label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-[#e7ece8] focus:border-[#ff5a1f] focus:ring-4 focus:ring-[#ff5a1f]/10 outline-none transition text-[#17201a] text-xs bg-[#f7faf7] focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#68736c] mb-1.5">
                  Số điện thoại
                </label>
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0912345678"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-[#e7ece8] focus:border-[#ff5a1f] focus:ring-4 focus:ring-[#ff5a1f]/10 outline-none transition text-[#17201a] text-xs bg-[#f7faf7] focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#68736c] mb-1.5">
                  Mật khẩu
                </label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-[#e7ece8] focus:border-[#ff5a1f] focus:ring-4 focus:ring-[#ff5a1f]/10 outline-none transition text-[#17201a] text-xs bg-[#f7faf7] focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#68736c] mb-1.5">
                  Nhập lại mật khẩu
                </label>
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-[#e7ece8] focus:border-[#ff5a1f] focus:ring-4 focus:ring-[#ff5a1f]/10 outline-none transition text-[#17201a] text-xs bg-[#f7faf7] focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#68736c] mb-1.5">
                Loại tài khoản
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('customer')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                    role === 'customer' 
                      ? 'border-[#ff5a1f] bg-[#fff0e9] text-[#ff5a1f]' 
                      : 'border-[#e7ece8] bg-white text-[#68736c] hover:bg-[#f7faf7]'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" /> Khách hàng
                </button>
                <button
                  type="button"
                  onClick={() => setRole('restaurant_owner')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                    role === 'restaurant_owner' 
                      ? 'border-[#ff5a1f] bg-[#fff0e9] text-[#ff5a1f]' 
                      : 'border-[#e7ece8] bg-white text-[#68736c] hover:bg-[#f7faf7]'
                  }`}
                >
                  <Store className="w-4 h-4" /> Chủ nhà hàng
                </button>
              </div>
            </div>
            
            <Button
              type="submit"
              disabled={isLoading}
              variant="primary"
              size="lg"
              fullWidth
              className="mt-2"
            >
              {isLoading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
            </Button>
            
            <p className="text-center text-xs text-[#68736c] pt-3 border-t border-[#e7ece8]">
              Đã có tài khoản?{' '}
              <Link to="/login" className="font-bold text-[#ff5a1f] hover:text-[#e94e16] transition">
                Đăng nhập ngay
              </Link>
            </p>
          </form>
        </div>
      </section>
    </div>
  )
}

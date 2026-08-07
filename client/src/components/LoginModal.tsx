import { Link } from 'react-router-dom'
import { ShoppingBag, X } from 'lucide-react'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  itemName?: string
}

export const LoginModal = ({ isOpen, onClose, itemName }: LoginModalProps) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 relative animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition"
          title="Đóng"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Icon & Title */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <ShoppingBag className="w-8 h-8 text-orange-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">
            Đăng nhập để tiếp tục
          </h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
            {itemName ? (
              <>Bạn cần đăng nhập để thêm <span className="font-semibold text-orange-600">"{itemName}"</span> vào giỏ hàng.</>
            ) : (
              'Bạn cần đăng nhập tài khoản để chọn món và tiến hành đặt hàng.'
            )}
          </p>
        </div>

        {/* Actions */}
        <div className="mt-6 space-y-3">
          <Link
            to="/login"
            className="block w-full py-3 text-center text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-xl shadow-lg shadow-orange-500/25 transition"
          >
            Đăng nhập ngay
          </Link>
          <Link
            to="/register"
            className="block w-full py-3 text-center text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
          >
            Chưa có tài khoản? Đăng ký
          </Link>
        </div>
      </div>
    </div>
  )
}

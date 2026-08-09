import { Link } from 'react-router-dom'
import { ShoppingBag, X } from 'lucide-react'
import { Button } from './ui/Button'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  itemName?: string
}

export const LoginModal = ({ isOpen, onClose, itemName }: LoginModalProps) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#17201a]/50 backdrop-blur-xs">
      <div 
        className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-xl border border-[#e7ece8] relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#f7faf7] hover:bg-[#e7ece8] text-[#68736c] flex items-center justify-center transition cursor-pointer"
          title="Đóng"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Icon & Title */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 bg-[#fff0e9] text-[#ff5a1f] rounded-2xl flex items-center justify-center mx-auto">
            <ShoppingBag className="w-7 h-7 text-[#ff5a1f]" />
          </div>
          <h3 className="text-xl font-bold text-[#17201a]">
            Đăng nhập để tiếp tục
          </h3>
          <p className="text-xs text-[#68736c] max-w-xs mx-auto leading-relaxed">
            {itemName ? (
              <>Bạn cần đăng nhập để thêm <span className="font-semibold text-[#ff5a1f]">"{itemName}"</span> vào giỏ hàng.</>
            ) : (
              'Bạn cần đăng nhập tài khoản để chọn món và tiến hành đặt hàng.'
            )}
          </p>
        </div>

        {/* Actions */}
        <div className="mt-6 space-y-3">
          <Link to="/login" className="block w-full">
            <Button variant="primary" size="md" fullWidth>
              Đăng nhập ngay
            </Button>
          </Link>
          <Link to="/register" className="block w-full">
            <Button variant="outline" size="md" fullWidth>
              Chưa có tài khoản? Đăng ký
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

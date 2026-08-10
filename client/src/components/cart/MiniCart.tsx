import React from 'react'
import { Link } from 'react-router-dom'
import { ShoppingBag, ArrowRight, Trash2 } from 'lucide-react'
import { useCart } from '../../contexts/CartContext'
import { Button } from '../ui/Button'

const formatMoney = (val: number) => `${new Intl.NumberFormat('vi-VN').format(val)}đ`

export const MiniCart: React.FC = () => {
  const { cart, isLoading, clearCart } = useCart()

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-1/2 rounded bg-slate-200" />
          <div className="h-16 rounded bg-slate-100" />
          <div className="h-10 rounded bg-slate-200" />
        </div>
      </div>
    )
  }

  const items = cart?.items || []
  const totalQuantity = items.reduce((acc, item) => acc + item.quantity, 0)
  const grandTotal = cart?.grandTotal || cart?.subtotal || 0

  return (
    <div className="sticky top-24 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-orange-50 text-orange-500">
            <ShoppingBag className="h-4 w-4" />
          </div>
          <h3 className="font-bold text-slate-800 text-base">Đơn hàng của bạn</h3>
        </div>
        {totalQuantity > 0 && (
          <span className="rounded-full bg-orange-500 px-2.5 py-0.5 text-xs font-extrabold text-white">
            {totalQuantity}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="py-8 text-center space-y-2">
          <p className="text-sm font-medium text-slate-500">Giỏ hàng đang trống</p>
          <p className="text-xs text-slate-400">Hãy chọn món ăn yêu thích để thưởng thức!</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="max-h-[280px] space-y-3 overflow-y-auto pr-1">
            {items.map((item, idx) => (
              <div
                key={item.menuItemId?._id || idx}
                className="flex items-center justify-between text-xs py-1 border-b border-slate-50 border-dashed"
              >
                <div className="flex-1 pr-2">
                  <p className="font-semibold text-slate-800 line-clamp-1">
                    {item.menuItemId?.name || 'Món ăn'}
                  </p>
                  <p className="text-slate-400">
                    {item.quantity} x {formatMoney(item.price)}
                  </p>
                </div>
                <span className="font-bold text-slate-700">
                  {formatMoney(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-100 pt-3 space-y-3">
            <div className="flex items-center justify-between font-bold text-sm">
              <span className="text-slate-600">Tổng cộng:</span>
              <span className="text-orange-600 text-base">{formatMoney(grandTotal)}</span>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={clearCart}
                className="p-2.5 rounded-xl border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-200 transition"
                title="Xóa giỏ hàng"
              >
                <Trash2 className="h-4 w-4" />
              </button>

              <Link to="/cart" className="flex-1">
                <Button fullWidth variant="primary" size="md">
                  <span>Thanh toán</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

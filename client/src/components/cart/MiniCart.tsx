import React from 'react'
import { Link } from 'react-router-dom'
import { ShoppingBag, ArrowRight, Trash2, Plus, Minus } from 'lucide-react'
import { useCart } from '../../contexts/CartContext'
import { Button } from '../ui/Button'
import { CartItem } from '../../types/cart'

const formatMoney = (val: number) => `${new Intl.NumberFormat('vi-VN').format(val)}đ`

interface MiniCartProps {
  restaurantId?: string
  restaurantName?: string
  deliveryFee?: number
  onUpdateQuantity?: (menuItemId: string, newQuantity: number) => void
}

export const MiniCart: React.FC<MiniCartProps> = ({
  restaurantId,
  restaurantName,
  deliveryFee = 0,
  onUpdateQuantity,
}) => {
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

  const isCurrentRestaurantCart = !restaurantId || cart?.restaurantId?._id === restaurantId
  const cartItems = (isCurrentRestaurantCart ? cart?.items : cart?.items) || []
  const totalQuantity = cartItems.reduce((acc, item) => acc + item.quantity, 0)
  const subtotal = cart?.subtotal || 0
  const fee = cartItems.length > 0 ? deliveryFee : 0
  const grandTotal = subtotal + fee

  return (
    <div className="sticky top-24 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-orange-50 text-orange-500">
            <ShoppingBag className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base">Giỏ hàng của bạn</h3>
            {restaurantName && <p className="text-[11px] text-slate-500">{restaurantName}</p>}
          </div>
        </div>
        {totalQuantity > 0 && (
          <span className="rounded-full bg-orange-500 px-2.5 py-0.5 text-xs font-extrabold text-white">
            {totalQuantity}
          </span>
        )}
      </div>

      {/* Cross-restaurant warning */}
      {cart && cart.items.length > 0 && restaurantId && cart.restaurantId?._id !== restaurantId && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] leading-5 text-amber-800">
          Giỏ hàng hiện có món từ <b>{cart.restaurantId?.name || 'nhà hàng khác'}</b>. Khi chọn món ở đây, hệ thống sẽ hỏi xác nhận trước khi đổi quán.
        </div>
      )}

      {/* Cart Content */}
      {cartItems.length === 0 ? (
        <div className="py-8 text-center space-y-2">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-orange-50 text-orange-500">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <p className="text-sm font-bold text-slate-800">Giỏ hàng đang trống</p>
          <p className="text-xs text-slate-400">Hãy chọn món ăn yêu thích để bắt đầu!</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="max-h-[280px] space-y-3 overflow-y-auto pr-1">
            {cartItems.map((item: CartItem, idx: number) => (
              <div
                key={item.menuItemId?._id || idx}
                className="flex items-center justify-between text-xs py-2 border-b border-slate-100 border-dashed"
              >
                <div className="flex-1 pr-2">
                  <p className="font-bold text-slate-800 line-clamp-1">
                    {item.menuItemId?.name || 'Món ăn'}
                  </p>
                  <p className="text-slate-400">
                    {formatMoney(item.price)}
                  </p>
                </div>

                {onUpdateQuantity ? (
                  <div className="inline-flex items-center overflow-hidden rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(item.menuItemId._id, item.quantity - 1)}
                      className="grid h-6 w-6 place-items-center bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="grid h-6 min-w-6 place-items-center text-[11px] font-bold text-slate-800">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(item.menuItemId._id, item.quantity + 1)}
                      className="grid h-6 w-6 place-items-center bg-white text-slate-600 hover:bg-slate-50"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <span className="font-bold text-slate-700">
                    {item.quantity} x {formatMoney(item.price * item.quantity)}
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-slate-100 pt-3 space-y-3 text-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span>Tạm tính:</span>
              <span className="font-bold text-slate-800">{formatMoney(subtotal)}</span>
            </div>
            {deliveryFee > 0 && (
              <div className="flex items-center justify-between text-slate-500">
                <span>Phí giao hàng:</span>
                <span className="font-bold text-slate-800">{formatMoney(fee)}</span>
              </div>
            )}
            <div className="flex items-center justify-between font-bold text-sm border-t border-slate-100 pt-2">
              <span className="text-slate-800">Tổng cộng:</span>
              <span className="text-orange-600 text-base">{formatMoney(grandTotal)}</span>
            </div>

            <div className="flex gap-2 pt-1">
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

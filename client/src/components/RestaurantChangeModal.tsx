import { ArrowRight, ShoppingBag, X } from 'lucide-react'

interface RestaurantChangeModalProps {
  isOpen: boolean
  currentRestaurantName: string
  nextRestaurantName: string
  onCancel: () => void
  onConfirm: () => void
}

export const RestaurantChangeModal = ({
  isOpen,
  currentRestaurantName,
  nextRestaurantName,
  onCancel,
  onConfirm,
}: RestaurantChangeModalProps) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/55 p-4" onMouseDown={onCancel}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="restaurant-change-title"
        className="relative w-full max-w-md rounded-3xl border border-[#e7ece8] bg-white p-6"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onCancel}
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full border-0 bg-slate-100 text-slate-500 hover:bg-slate-200"
          aria-label="Đóng"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-[#fff0e9] text-[#ff5a1f]">
          <ShoppingBag className="h-7 w-7" />
        </div>
        <h2 id="restaurant-change-title" className="mb-2 text-2xl font-extrabold tracking-[-.03em]">
          Bạn muốn đổi nhà hàng?
        </h2>
        <p className="mb-5 text-sm leading-6 text-[#68736c]">
          Giỏ hàng đang có món từ <b className="text-[#17201a]">{currentRestaurantName}</b>. Nếu tiếp tục
          với <b className="text-[#17201a]">{nextRestaurantName}</b>, các món trong giỏ cũ sẽ được xoá.
        </p>
        <div className="mb-6 flex items-center gap-3 rounded-2xl bg-[#f7faf7] p-4 text-xs font-bold">
          <span className="min-w-0 flex-1 truncate">{currentRestaurantName}</span>
          <ArrowRight className="h-4 w-4 shrink-0 text-[#ff5a1f]" />
          <span className="min-w-0 flex-1 truncate text-right">{nextRestaurantName}</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-11 rounded-xl border border-[#e7ece8] bg-white px-4 font-bold hover:border-[#ff5a1f]"
          >
            Giữ giỏ cũ
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="min-h-11 rounded-xl border-0 bg-[#ff5a1f] px-4 font-bold text-white hover:bg-[#e94e16]"
          >
            Đổi nhà hàng
          </button>
        </div>
      </section>
    </div>
  )
}

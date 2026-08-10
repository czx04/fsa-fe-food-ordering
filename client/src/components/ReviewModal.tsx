import { useEffect, useState } from "react";
import { Loader2, Star, Trash2, X } from "lucide-react";

import { orderService } from "../services/orderService";
import { CustomerReview, OrderSummary } from "../types/order";
import { useToast } from "../contexts/ToastContext";
import { ConfirmationModal } from "./ConfirmationModal";

interface ReviewModalProps {
  order: OrderSummary;
  onClose: () => void;
  onChanged: (review: CustomerReview | null) => void;
}

const statusMessages: Record<CustomerReview["visibilityStatus"], string> = {
  visible: "Đánh giá đang hiển thị công khai.",
  hidden: "Đánh giá đang được quản trị viên ẩn.",
  flagged: "Đánh giá đang chờ quản trị viên kiểm tra.",
};

export const ReviewModal = ({ order, onClose, onChanged }: ReviewModalProps) => {
  const currentReview = order.review ?? null;
  const [rating, setRating] = useState(currentReview?.rating ?? 0);
  const [content, setContent] = useState(currentReview?.content ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const toast = useToast();

  useEffect(() => {
    setRating(currentReview?.rating ?? 0);
    setContent(currentReview?.content ?? "");
  }, [currentReview]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedContent = content.trim();
    if (rating < 1) {
      toast.warning("Vui lòng chọn số sao.");
      return;
    }
    if (trimmedContent.length < 3) {
      toast.warning("Nội dung đánh giá phải có ít nhất 3 ký tự.");
      return;
    }

    setSubmitting(true);
    try {
      const response = currentReview
        ? await orderService.updateReview(order._id, {
            rating,
            content: trimmedContent,
          })
        : await orderService.createReview(order._id, {
            rating,
            content: trimmedContent,
          });
      onChanged(response.review);
      toast.success(response.message);
      onClose();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          "Không thể lưu đánh giá. Vui lòng thử lại.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await orderService.deleteReview(order._id);
      onChanged(null);
      toast.success(response.message);
      setConfirmDelete(false);
      onClose();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          "Không thể xóa đánh giá. Vui lòng thử lại.",
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-modal-title"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget && !submitting) onClose();
        }}
      >
        <form
          onSubmit={handleSubmit}
          className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="review-modal-title" className="text-2xl font-bold text-gray-900">
                {currentReview ? "Sửa đánh giá" : "Đánh giá đơn hàng"}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                #{order.orderNumber} · {order.restaurantSnapshot.name}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              aria-label="Đóng"
              className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {currentReview && (
            <p
              className={`mt-4 rounded-lg px-3 py-2 text-sm ${
                currentReview.visibilityStatus === "visible"
                  ? "bg-green-50 text-green-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              {statusMessages[currentReview.visibilityStatus]}
            </p>
          )}

          <fieldset className="mt-6">
            <legend className="mb-2 font-semibold text-gray-800">Mức độ hài lòng</legend>
            <div className="flex gap-2" aria-label={`${rating} trên 5 sao`}>
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  aria-label={`${value} sao`}
                  aria-pressed={rating === value}
                  className="rounded-md p-1 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-orange-400"
                >
                  <Star
                    className={`h-9 w-9 ${
                      value <= rating
                        ? "fill-amber-400 text-amber-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
          </fieldset>

          <label className="mt-6 block">
            <span className="font-semibold text-gray-800">Nội dung đánh giá</span>
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              rows={5}
              minLength={3}
              maxLength={1000}
              required
              placeholder="Món ăn, đóng gói và trải nghiệm giao hàng thế nào?"
              className="mt-2 w-full resize-y rounded-lg border border-gray-300 px-3 py-2 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
            <span className="mt-1 block text-right text-xs text-gray-400">
              {content.length}/1000
            </span>
          </label>

          {currentReview?.ownerReply && (
            <div className="mt-4 rounded-lg border-l-4 border-orange-400 bg-orange-50 p-3">
              <p className="text-sm font-semibold text-orange-800">Phản hồi từ nhà hàng</p>
              <p className="mt-1 text-sm text-gray-700">{currentReview.ownerReply.content}</p>
            </div>
          )}

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            {currentReview ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 px-4 py-2 font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" /> Xóa đánh giá
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 sm:flex-none"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitting || rating < 1 || content.trim().length < 3}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-orange-500 px-5 py-2 font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-gray-400 sm:flex-none"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {submitting ? "Đang lưu..." : currentReview ? "Lưu thay đổi" : "Gửi đánh giá"}
              </button>
            </div>
          </div>
        </form>
      </div>

      <ConfirmationModal
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Xóa đánh giá?"
        message="Đánh giá sẽ không còn hiển thị và điểm của nhà hàng sẽ được tính lại."
        confirmText="Xóa đánh giá"
        isDestructive
        isConfirming={deleting}
      />
    </>
  );
};

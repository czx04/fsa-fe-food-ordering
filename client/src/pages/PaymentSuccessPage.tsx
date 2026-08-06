import { Link } from "react-router-dom";

function PaymentSuccessPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 md:p-12 rounded-lg shadow-xl text-center max-w-md w-full">
        <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-green-100 mb-6">
          <svg
            className="h-12 w-12 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Đặt hàng thành công!
        </h1>
        <p className="text-gray-600 mb-6">
          Cảm ơn bạn đã đặt hàng. Đơn hàng{" "}
          <span className="font-semibold text-gray-800">
            #FD-20240805-1A2B3C
          </span>{" "}
          của bạn đang được xử lý.
        </p>
        <div className="space-y-4">
          <Link
            to="/order/66b0e0c0e0c0e0c0e0c0e141"
            className="w-full bg-orange-500 text-white py-3 rounded-md font-semibold hover:bg-orange-600 transition-colors duration-200 block"
          >
            Xem chi tiết đơn hàng
          </Link>
          <Link
            to="/"
            className="w-full bg-gray-200 text-gray-800 py-3 rounded-md font-semibold hover:bg-gray-300 transition-colors duration-200 block"
          >
            Tiếp tục mua sắm
          </Link>
        </div>
      </div>
    </main>
  );
}

export default PaymentSuccessPage;

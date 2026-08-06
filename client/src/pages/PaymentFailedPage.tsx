import { Link } from "react-router-dom";

function PaymentFailedPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 md:p-12 rounded-lg shadow-xl text-center max-w-md w-full">
        <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-red-100 mb-6">
          <svg
            className="h-12 w-12 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Thanh toán thất bại
        </h1>
        <p className="text-gray-600 mb-6">
          Đã có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại hoặc
          chọn phương thức thanh toán khác.
        </p>
        <div className="space-y-4">
          <Link
            to="/checkout"
            className="w-full bg-orange-500 text-white py-3 rounded-md font-semibold hover:bg-orange-600 transition-colors duration-200 block"
          >
            Thử lại
          </Link>
          <Link
            to="/"
            className="w-full bg-gray-200 text-gray-800 py-3 rounded-md font-semibold hover:bg-gray-300 transition-colors duration-200 block"
          >
            Quay về trang chủ
          </Link>
        </div>
      </div>
    </main>
  );
}

export default PaymentFailedPage;

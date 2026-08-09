import { Link, useSearchParams } from "react-router-dom";
import { XCircle } from "lucide-react";

function PaymentFailedPage() {
  const [searchParams] = useSearchParams();
  const reason =
    searchParams.get("reason") ||
    "Đã có lỗi xảy ra trong quá trình thanh toán.";

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 md:p-12 rounded-lg shadow-xl text-center max-w-md w-full">
        <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-red-100 mb-6">
          <XCircle className="h-16 w-16 text-red-500" />
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Thanh toán thất bại
        </h1>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm mb-6">
          <p>
            <b>Lý do:</b> {reason}
          </p>
        </div>
        <div className="space-y-4">
          <Link
            to="/checkout"
            className="w-full bg-orange-500 text-white py-3 rounded-md font-semibold hover:bg-orange-600 transition-colors duration-200 block"
          >
            Thử lại thanh toán
          </Link>
          <Link
            to="/cart"
            className="w-full bg-gray-200 text-gray-800 py-3 rounded-md font-semibold hover:bg-gray-300 transition-colors duration-200 block"
          >
            Quay lại giỏ hàng
          </Link>
        </div>
      </div>
    </main>
  );
}

export default PaymentFailedPage;

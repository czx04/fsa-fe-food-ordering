import { Link } from 'react-router-dom'

function NotFoundPage() {
  return (
    <main>
      <h1>404 - Không tìm thấy trang</h1>
      <Link to="/">Quay về trang chủ</Link>
    </main>
  )
}

export default NotFoundPage

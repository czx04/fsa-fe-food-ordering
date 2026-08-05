import { Link } from 'react-router-dom'

function HomePage() {
  return (
    <main>
      <h1>Trang chủ</h1>
      <Link to="/login">Đi đến trang đăng nhập</Link>
    </main>
  )
}

export default HomePage

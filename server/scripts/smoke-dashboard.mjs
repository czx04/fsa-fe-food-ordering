const baseUrl = process.env.DASHBOARD_API_BASE_URL ?? 'http://127.0.0.1:3000/api'

const checks = []

const request = async (path, options = {}, expected = 200) => {
  const response = await fetch(`${baseUrl}${path}`, options)
  let body = null
  try { body = await response.json() } catch { /* response body is optional */ }
  checks.push({ path, status: response.status, expected })
  if (response.status !== expected) {
    throw new Error(`${path}: expected ${expected}, received ${response.status} (${body?.message ?? 'no message'})`)
  }
  return body
}

const login = async (email) => request('/auth/login', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ email, password: 'password123' }),
})

const authorization = (accessToken) => ({ authorization: `Bearer ${accessToken}` })

const admin = await login('admin@foodordering.com')
const adminHeaders = authorization(admin.accessToken)
for (const path of [
  '/auth/me',
  '/admin/dashboard',
  '/admin/restaurants?page=1&limit=5',
  '/admin/users?page=1&limit=5',
  '/admin/orders?page=1&limit=5',
  '/admin/cuisines',
  '/admin/coupons?page=1&limit=5',
  '/admin/reviews?page=1&limit=5',
  '/admin/analytics?range=30d',
  '/admin/audit-logs?page=1&limit=5',
]) await request(path, { headers: adminHeaders })

const ownerOne = await login('owner1@foodordering.com')
const ownerTwo = await login('owner2@foodordering.com')
const ownerOneHeaders = authorization(ownerOne.accessToken)
const ownerTwoHeaders = authorization(ownerTwo.accessToken)
const ownerOneRestaurants = await request('/owner/restaurants', { headers: ownerOneHeaders })
const ownerTwoRestaurants = await request('/owner/restaurants', { headers: ownerTwoHeaders })

for (const restaurant of ownerOneRestaurants.data.slice(0, 1)) {
  for (const suffix of ['dashboard?range=30d', 'orders?page=1&limit=5', 'menu-categories', 'menu-items?page=1&limit=5', 'reviews?page=1&limit=5']) {
    await request(`/owner/restaurants/${restaurant._id}/${suffix}`, { headers: ownerOneHeaders })
  }
}

if (ownerTwoRestaurants.data[0]) {
  await request(`/owner/restaurants/${ownerTwoRestaurants.data[0]._id}`, { headers: ownerOneHeaders }, 404)
}

await request('/admin/dashboard', { headers: ownerOneHeaders }, 403)
await request('/owner/restaurants', {}, 401)

const refreshed = await request('/auth/refresh', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ refreshToken: admin.refreshToken }),
})
await request('/auth/logout', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ refreshToken: refreshed.refreshToken }),
})

console.log(`Dashboard smoke passed: ${checks.length} HTTP checks.`)

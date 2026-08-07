import axios from 'axios'

export const mockApi = axios.create({
  baseURL: 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
})

// api.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem('accessToken')
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`
//     }
//     return config
//   },
//   (error) => Promise.reject(error)
// )

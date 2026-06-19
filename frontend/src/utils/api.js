import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

// Selipkan token JWT ke setiap request jika tersedia
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pkkmb_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Jika token tidak valid/kadaluarsa, hapus dan redirect ke login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && window.location.pathname.startsWith('/admin')) {
      localStorage.removeItem('pkkmb_token')
      if (window.location.pathname !== '/admin/login') {
        window.location.href = '/admin/login'
      }
    }
    return Promise.reject(err)
  }
)

export const predictSingle = (teks) =>
  api.post('/predict', { teks }).then(r => r.data.data)

export const predictBatch = (texts) =>
  api.post('/predict/batch', { texts }).then(r => r.data)

export const uploadCSV = (formData) =>
  api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(r => r.data)

export const getStats = () =>
  api.get('/stats').then(r => r.data.data)

export const healthCheck = () =>
  api.get('/health').then(r => r.data)

export default api

import axios from 'axios'

// Change this to your deployed backend URL or local dev server IP
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000/api'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
})

export const clipboardApi = {
  create: (data) => api.post('/clipboard/', data).then((r) => r.data),
  get: (code) => api.get(`/clipboard/${code}/`).then((r) => r.data),
  update: (code, data) => api.put(`/clipboard/${code}/`, data).then((r) => r.data),
  delete: (code) => api.delete(`/clipboard/${code}/`).then((r) => r.data),
  verifyPassword: (code, password) =>
    api.post(`/clipboard/${code}/verify-password/`, { password }).then((r) => r.data),
  search: (q) => api.get('/clipboard/search/', { params: { q } }).then((r) => r.data),
}

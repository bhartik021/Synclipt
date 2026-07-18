import api from './axios'

export const clipboardApi = {
  create: (data) => api.post('/clipboard/', data),

  get: (code) => api.get(`/clipboard/${code}/`),

  update: (code, data) => api.put(`/clipboard/${code}/`, data),

  delete: (code) => api.delete(`/clipboard/${code}/`),

  verifyPassword: (code, password) =>
    api.post(`/clipboard/${code}/verify-password/`, { password }),

  search: (q) => api.get('/clipboard/search/', { params: { q } }),
}

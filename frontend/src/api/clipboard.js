import api from './axios'

const TOKEN_KEY = (code) => `synclipt_token_${code}`

export const clipboardApi = {
  create: (data) => api.post('/clipboard/', data),

  get: (code) => api.get(`/clipboard/${code}/`),

  update: (code, data) => api.put(`/clipboard/${code}/`, data),

  delete: (code) => {
    const token = localStorage.getItem(TOKEN_KEY(code)) || ''
    return api.delete(`/clipboard/${code}/`, { headers: { 'X-Delete-Token': token } })
  },

  verifyPassword: (code, password) =>
    api.post(`/clipboard/${code}/verify-password/`, { password }),

  search: (q) => api.get('/clipboard/search/', { params: { q } }),

  saveToken: (code, token) => localStorage.setItem(TOKEN_KEY(code), token),
  hasToken: (code) => !!localStorage.getItem(TOKEN_KEY(code)),
  getToken: (code) => localStorage.getItem(TOKEN_KEY(code)) || '',
}

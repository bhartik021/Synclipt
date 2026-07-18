import api from './axios'

export const filesApi = {
  upload: (formData, onProgress) =>
    api.post('/files/upload/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total))
      },
    }),

  get: (id) => api.get(`/files/${id}/`),

  delete: (id) => api.delete(`/files/${id}/`),

  getDownloadUrl: (id) => `${import.meta.env.VITE_API_URL || '/api'}/files/${id}/download/`,
}

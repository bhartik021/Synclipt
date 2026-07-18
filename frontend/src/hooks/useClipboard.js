import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { clipboardApi } from '../api/clipboard'
import toast from 'react-hot-toast'

export function useClipboardQuery(code) {
  return useQuery({
    queryKey: ['clipboard', code],
    queryFn: () => clipboardApi.get(code).then((r) => r.data),
    enabled: Boolean(code),
    retry: (failureCount, error) => {
      if ([404, 410, 403].includes(error.response?.status)) return false
      return failureCount < 2
    },
  })
}

export function useCreateClipboard() {
  return useMutation({
    mutationFn: (data) => clipboardApi.create(data).then((r) => r.data),
    onSuccess: (data) => {
      if (data.code && data.delete_token) {
        clipboardApi.saveToken(data.code, data.delete_token)
      }
    },
    onError: (error) => {
      const msg = error.response?.data?.error
        || error.response?.data?.detail
        || (error.message === 'Network Error' ? 'Cannot reach server — is the backend running?' : null)
        || 'Failed to create clipboard'
      console.error('[clipboard create]', error)
      toast.error(msg)
    },
  })
}

export function useUpdateClipboard(code) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => clipboardApi.update(code, data).then((r) => r.data),
    onSuccess: (data) => {
      queryClient.setQueryData(['clipboard', code], data)
    },
    onError: () => toast.error('Failed to update clipboard'),
  })
}

export function useDeleteClipboard() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (code) => clipboardApi.delete(code),
    onSuccess: (_, code) => {
      queryClient.removeQueries({ queryKey: ['clipboard', code] })
      toast.success('Clipboard deleted')
    },
    onError: (error) => {
      if (error.response?.status === 403) {
        toast.error('You can only delete clipboards you created.')
      } else {
        toast.error('Failed to delete clipboard')
      }
    },
  })
}

export function useVerifyPassword() {
  return useMutation({
    mutationFn: ({ code, password }) => clipboardApi.verifyPassword(code, password).then((r) => r.data),
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Incorrect password')
    },
  })
}

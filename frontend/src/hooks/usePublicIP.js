import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

export function usePublicIP() {
  return useQuery({
    queryKey: ['public-ip'],
    queryFn: async () => {
      const { data } = await axios.get('https://api4.ipify.org?format=json', { timeout: 5000 })
      return data.ip
    },
    staleTime: Infinity,
    retry: 1,
    refetchOnWindowFocus: false,
  })
}

export function useDeviceInfo() {
  const ua = navigator.userAgent
  let os = 'Unknown'
  let device = 'Desktop'

  if (/Windows/.test(ua)) os = 'Windows'
  else if (/Mac OS/.test(ua)) os = 'macOS'
  else if (/Linux/.test(ua)) os = 'Linux'
  else if (/Android/.test(ua)) os = 'Android'
  else if (/iPhone|iPad/.test(ua)) os = 'iOS'

  if (/Mobi|Android/.test(ua)) device = 'Mobile'
  else if (/Tablet|iPad/.test(ua)) device = 'Tablet'

  let browser = 'Browser'
  if (/Chrome/.test(ua) && !/Edg/.test(ua)) browser = 'Chrome'
  else if (/Firefox/.test(ua)) browser = 'Firefox'
  else if (/Safari/.test(ua) && !/Chrome/.test(ua)) browser = 'Safari'
  else if (/Edg/.test(ua)) browser = 'Edge'

  return { os, device, browser }
}

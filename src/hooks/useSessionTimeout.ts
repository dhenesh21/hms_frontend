import { useEffect, useRef, useCallback } from 'react'
import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes
const WARNING_MS = 2 * 60 * 1000  // warn 2 mins before

export function useSessionTimeout() {
  const { isAuthenticated, logout } = useAuthStore()
  const navigate = useNavigate()
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>()
  const warningRef = useRef<ReturnType<typeof setTimeout>>()
  const toastIdRef = useRef<string>()

  const resetTimer = useCallback(() => {
    clearTimeout(timeoutRef.current)
    clearTimeout(warningRef.current)
    if (toastIdRef.current) toast.dismiss(toastIdRef.current)

    if (!isAuthenticated) return

    // Warning 2 mins before
    warningRef.current = setTimeout(() => {
      toastIdRef.current = toast(
        '⚠️ Session expires in 2 minutes due to inactivity',
        { duration: 120000, icon: '⏰' }
      ) as string
    }, TIMEOUT_MS - WARNING_MS)

    // Auto logout
    timeoutRef.current = setTimeout(() => {
      if (toastIdRef.current) toast.dismiss(toastIdRef.current)
      toast.error('Session expired. Please login again.')
      logout()
      navigate('/login')
    }, TIMEOUT_MS)
  }, [isAuthenticated, logout, navigate])

  useEffect(() => {
    if (!isAuthenticated) return
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    const handler = () => resetTimer()
    events.forEach(e => window.addEventListener(e, handler, { passive: true }))
    resetTimer()
    return () => {
      events.forEach(e => window.removeEventListener(e, handler))
      clearTimeout(timeoutRef.current)
      clearTimeout(warningRef.current)
    }
  }, [isAuthenticated, resetTimer])
}

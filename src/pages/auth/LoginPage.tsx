import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { authService } from '../../services/api'
import { useAuthStore } from '../../store/authStore'
import { Hospital, Eye, EyeOff, Lock, Mail } from 'lucide-react'

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<{
    email: string; password: string
  }>()

  const onSubmit = async (data: { email: string; password: string }) => {
    setLoading(true)
    try {
      const res = await authService.login(data.email, data.password)
      const { access_token, refresh_token, user } = res
      setAuth(user, access_token, refresh_token)
      toast.success(`Welcome, ${user.full_name}!`)
      navigate('/dashboard')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 50%, #DDD6FE 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16, fontFamily: "'Plus Jakarta Sans', sans-serif"
    }}>
      {/* Decorative circles */}
      <div style={{
        position: 'fixed', top: -100, right: -100,
        width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'fixed', bottom: -80, left: -80,
        width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(79,70,229,0.12) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Card */}
        <div style={{
          background: '#fff',
          borderRadius: 24,
          border: '1px solid #EDE9FE',
          padding: '40px 36px',
          boxShadow: '0 20px 60px rgba(124, 58, 237, 0.12)'
        }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              width: 64, height: 64,
              background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
              borderRadius: 18,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(124, 58, 237, 0.35)',
              marginBottom: 16
            }}>
              <Hospital size={28} color="#fff" />
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1E1B4B', margin: 0 }}>HMS Portal</h1>
            <p style={{ fontSize: 13.5, color: '#8B5CF6', marginTop: 4 }}>Hospital Management System</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#4C1D95', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} color="#A78BFA" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  {...register('email', { required: 'Email is required' })}
                  placeholder="doctor@hospital.com"
                  style={{
                    width: '100%', padding: '11px 14px 11px 40px',
                    border: errors.email ? '1.5px solid #EF4444' : '1.5px solid #EDE9FE',
                    borderRadius: 12, fontSize: 14, fontFamily: 'inherit',
                    color: '#1E1B4B', background: '#FAFAFF', outline: 'none',
                  }}
                  onFocus={e => e.target.style.borderColor = '#7C3AED'}
                  onBlur={e => e.target.style.borderColor = errors.email ? '#EF4444' : '#EDE9FE'}
                />
              </div>
              {errors.email && <p style={{ color: '#EF4444', fontSize: 11.5, marginTop: 4 }}>{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#4C1D95', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} color="#A78BFA" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', { required: 'Password is required' })}
                  placeholder="••••••••"
                  style={{
                    width: '100%', padding: '11px 44px 11px 40px',
                    border: errors.password ? '1.5px solid #EF4444' : '1.5px solid #EDE9FE',
                    borderRadius: 12, fontSize: 14, fontFamily: 'inherit',
                    color: '#1E1B4B', background: '#FAFAFF', outline: 'none',
                  }}
                  onFocus={e => e.target.style.borderColor = '#7C3AED'}
                  onBlur={e => e.target.style.borderColor = errors.password ? '#EF4444' : '#EDE9FE'}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#A78BFA', padding: 4
                  }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p style={{ color: '#EF4444', fontSize: 11.5, marginTop: 4 }}>{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={loading}
              style={{
                width: '100%', padding: '13px',
                background: loading ? '#C4B5FD' : 'linear-gradient(135deg, #7C3AED, #4F46E5)',
                color: '#fff', border: 'none', borderRadius: 12,
                fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                boxShadow: loading ? 'none' : '0 6px 20px rgba(124, 58, 237, 0.35)',
                transition: 'all 0.2s'
              }}>
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 12, color: '#C4B5FD', marginTop: 24 }}>
            🔒 Secure HMS Portal · Contact admin for access
          </p>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { patientAuthService, PATIENT_TOKEN_KEY, PATIENT_ID_KEY } from '../../services/patientApi'
import toast from 'react-hot-toast'

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none"

export default function PatientLoginPage() {
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await patientAuthService.login(phone, password)
      localStorage.setItem(PATIENT_TOKEN_KEY, res.data.access_token)
      localStorage.setItem(PATIENT_ID_KEY, String(res.data.patient_id))
      navigate('/patient/home')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Incorrect phone or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB' }}>
      <div style={{ width: 380, background: '#fff', borderRadius: 16, padding: 32, border: '1px solid #E5E7EB' }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1E1B4B', marginBottom: 4 }}>Welcome back</h1>
        <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 24 }}>Sign in to your patient portal</p>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input value={phone} onChange={e => setPhone(e.target.value)} className={inputCls} placeholder="Phone number" required />
          <input value={password} onChange={e => setPassword(e.target.value)} type="password" className={inputCls} placeholder="Password" required />
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
        </form>
        <p style={{ fontSize: 13, color: '#6B7280', textAlign: 'center', marginTop: 20 }}>
          Don't have an account? <Link to="/patient/register" style={{ color: '#7C3AED', fontWeight: 600 }}>Register</Link>
        </p>
      </div>
    </div>
  )
}

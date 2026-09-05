import { useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { authService } from '../../services/api'
import { ShieldCheck, ShieldOff, KeyRound } from 'lucide-react'
import toast from 'react-hot-toast'

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none"

export default function MFASettingsPage() {
  const user = useAuthStore((s) => s.user)
  const [setupData, setSetupData] = useState<{ secret: string; qr_code: string } | null>(null)
  const [confirmCode, setConfirmCode] = useState('')
  const [disablePassword, setDisablePassword] = useState('')
  const [disableCode, setDisableCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [showDisableForm, setShowDisableForm] = useState(false)
  const [mfaEnabled, setMfaEnabled] = useState(user?.mfa_enabled ?? false)

  const startSetup = async () => {
    setLoading(true)
    try {
      const data = await authService.mfaSetup()
      setSetupData(data)
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Failed to start MFA setup')
    } finally {
      setLoading(false)
    }
  }

  const confirmSetup = async () => {
    if (confirmCode.length !== 6) return
    setLoading(true)
    try {
      await authService.mfaConfirm(confirmCode)
      toast.success('MFA enabled successfully')
      setMfaEnabled(true)
      setSetupData(null)
      setConfirmCode('')
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Invalid code')
    } finally {
      setLoading(false)
    }
  }

  const disableMfa = async () => {
    if (!disablePassword || disableCode.length !== 6) return
    setLoading(true)
    try {
      await authService.mfaDisable(disablePassword, disableCode)
      toast.success('MFA disabled')
      setMfaEnabled(false)
      setShowDisableForm(false)
      setDisablePassword('')
      setDisableCode('')
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Failed to disable MFA')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 480 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 className="page-title">Two-Factor Authentication</h1>
        <p style={{ color: '#8B5CF6', fontSize: 13 }}>Add an extra layer of security to your account</p>
      </div>

      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          {mfaEnabled ? <ShieldCheck size={28} color="#15803D" /> : <ShieldOff size={28} color="#9CA3AF" />}
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#1E1B4B' }}>
              {mfaEnabled ? 'MFA is enabled' : 'MFA is not enabled'}
            </p>
            <p style={{ fontSize: 12, color: '#6B7280' }}>
              {mfaEnabled ? 'Your account requires a code at login.' : 'Set up an authenticator app for extra security.'}
            </p>
          </div>
        </div>

        {!mfaEnabled && !setupData && (
          <button className="btn-primary" onClick={startSetup} disabled={loading}>
            {loading ? 'Starting...' : 'Set Up MFA'}
          </button>
        )}

        {setupData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontSize: 12, color: '#4C1D95' }}>Scan this QR code with Google Authenticator, Authy, or a similar app:</p>
            <img src={setupData.qr_code} alt="MFA QR Code" style={{ width: 200, height: 200, alignSelf: 'center', borderRadius: 8, border: '1px solid #EDE9FE' }} />
            <p style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center' }}>Or enter this key manually: <code>{setupData.secret}</code></p>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4C1D95', marginBottom: 4 }}>Enter the 6-digit code to confirm</label>
              <input
                type="text" inputMode="numeric" maxLength={6}
                value={confirmCode}
                onChange={e => setConfirmCode(e.target.value.replace(/\D/g, ''))}
                className={inputCls}
                placeholder="000000"
                style={{ textAlign: 'center', letterSpacing: '0.3em', fontSize: 18 }}
              />
            </div>
            <button className="btn-primary" onClick={confirmSetup} disabled={loading || confirmCode.length !== 6}>
              {loading ? 'Confirming...' : 'Confirm & Enable'}
            </button>
          </div>
        )}

        {mfaEnabled && !showDisableForm && (
          <button className="btn-ghost" style={{ color: '#DC2626' }} onClick={() => setShowDisableForm(true)}>
            Disable MFA
          </button>
        )}

        {showDisableForm && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8, paddingTop: 16, borderTop: '1px solid #F3F4F6' }}>
            <p style={{ fontSize: 12, color: '#DC2626', display: 'flex', alignItems: 'center', gap: 6 }}>
              <KeyRound size={14} /> Confirm your password and a current code to disable MFA
            </p>
            <input type="password" value={disablePassword} onChange={e => setDisablePassword(e.target.value)} className={inputCls} placeholder="Password" />
            <input
              type="text" inputMode="numeric" maxLength={6}
              value={disableCode}
              onChange={e => setDisableCode(e.target.value.replace(/\D/g, ''))}
              className={inputCls}
              placeholder="6-digit code"
              style={{ textAlign: 'center', letterSpacing: '0.3em' }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-primary" style={{ background: '#DC2626' }} onClick={disableMfa} disabled={loading}>
                {loading ? 'Disabling...' : 'Confirm Disable'}
              </button>
              <button className="btn-ghost" onClick={() => setShowDisableForm(false)}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

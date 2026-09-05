import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminService } from '../../services/api'
import { Building2, Phone, Mail, MapPin, Receipt, Save, Globe } from 'lucide-react'
import toast from 'react-hot-toast'

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none"

const FIELDS = [
  { key: 'hospital_name', label: 'Hospital Name', icon: Building2, placeholder: 'City General Hospital', category: 'hospital' },
  { key: 'hospital_tagline', label: 'Tagline / Motto', icon: Building2, placeholder: 'Health. Care. First.', category: 'hospital' },
  { key: 'hospital_address', label: 'Address', icon: MapPin, placeholder: '123 Medical Street, City', category: 'hospital' },
  { key: 'hospital_city', label: 'City', icon: MapPin, placeholder: 'Chennai', category: 'hospital' },
  { key: 'hospital_state', label: 'State', icon: MapPin, placeholder: 'Tamil Nadu', category: 'hospital' },
  { key: 'hospital_pincode', label: 'Pincode', icon: MapPin, placeholder: '600001', category: 'hospital' },
  { key: 'hospital_phone', label: 'Phone', icon: Phone, placeholder: '+91 98765 43210', category: 'hospital' },
  { key: 'hospital_email', label: 'Email', icon: Mail, placeholder: 'info@hospital.com', category: 'hospital' },
  { key: 'hospital_website', label: 'Website', icon: Globe, placeholder: 'www.hospital.com', category: 'hospital' },
  { key: 'hospital_gst_number', label: 'GST Number', icon: Receipt, placeholder: '27AAPFU0939F1ZV', category: 'billing' },
  { key: 'hospital_pan_number', label: 'PAN Number', icon: Receipt, placeholder: 'AAPFU0939F', category: 'billing' },
  { key: 'hospital_reg_number', label: 'Registration Number', icon: Receipt, placeholder: 'MH/2024/12345', category: 'billing' },
  { key: 'bill_prefix', label: 'Bill Number Prefix', icon: Receipt, placeholder: 'BILL', category: 'billing' },
  { key: 'appointment_prefix', label: 'Appointment Number Prefix', icon: Receipt, placeholder: 'APT', category: 'billing' },
]

export default function HospitalSettingsPage() {
  const qc = useQueryClient()
  const [values, setValues] = useState<Record<string, string>>({})
  const [activeTab, setActiveTab] = useState<'hospital' | 'billing'>('hospital')

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings-all'],
    queryFn: () => adminService.listSettings().then(r => r.data)
  })

  useEffect(() => {
    if (settings) {
      const map: Record<string, string> = {}
      settings.forEach((s: any) => { map[s.key] = s.value || '' })
      setValues(map)
    }
  }, [settings])

  const saveSetting = useMutation({
    mutationFn: async (updates: Record<string, string>) => {
      const promises = Object.entries(updates).map(([key, value]) =>
        adminService.updateSetting(key, { value }).catch(() =>
          adminService.createSetting({ key, value, category: FIELDS.find(f => f.key === key)?.category || 'hospital', description: key })
        )
      )
      return Promise.all(promises)
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['settings-all'] }); toast.success('Settings saved!') },
    onError: () => toast.error('Failed to save some settings')
  })

  const handleSave = () => {
    const filtered = Object.fromEntries(
      FIELDS.filter(f => f.category === activeTab).map(f => [f.key, values[f.key] || ''])
    )
    saveSetting.mutate(filtered)
  }

  const tabs = [
    { key: 'hospital', label: 'Hospital Info' },
    { key: 'billing', label: 'Billing & Tax' },
  ] as const

  const visibleFields = FIELDS.filter(f => f.category === activeTab)

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 className="page-title">Hospital Settings</h1>
        <p style={{ color: '#8B5CF6', fontSize: 13 }}>Configure hospital profile, billing details and system preferences</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '2px solid #F3F0FF', paddingBottom: 0 }}>
        {tabs.map(({ key, label }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            style={{
              padding: '8px 18px', fontSize: 13, fontWeight: 600, border: 'none',
              background: 'none', cursor: 'pointer', marginBottom: -2,
              borderBottom: activeTab === key ? '2px solid #7C3AED' : '2px solid transparent',
              color: activeTab === key ? '#7C3AED' : '#9CA3AF',
            }}>
            {label}
          </button>
        ))}
      </div>

      <div className="card">
        {isLoading ? (
          <p style={{ color: '#C4B5FD', textAlign: 'center', padding: 32 }}>Loading settings...</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {visibleFields.map(({ key, label, icon: Icon, placeholder }) => (
              <div key={key}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#4C1D95', marginBottom: 6 }}>
                  <Icon size={12} /> {label}
                </label>
                <input
                  value={values[key] || ''}
                  onChange={e => setValues(v => ({ ...v, [key]: e.target.value }))}
                  className={inputCls}
                  placeholder={placeholder}
                />
              </div>
            ))}
          </div>
        )}

        <button onClick={handleSave} disabled={saveSetting.isPending}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, marginTop: 24,
            padding: '10px 24px', fontSize: 14, fontWeight: 600, borderRadius: 10,
            border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg,#7C3AED,#4F46E5)',
            color: '#fff', boxShadow: '0 4px 12px rgba(124,58,237,0.3)',
          }}>
          <Save size={15} />
          {saveSetting.isPending ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, useFieldArray } from 'react-hook-form'
import { birthRegisterService } from '../../services/api'
import { PatientSearchInput } from '../../components/ui/PatientSearchInput'
import { Baby, Plus, Trash2, FileCheck, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { cleanPayload } from '../../utils/form'
import CustomSelect from '../../components/ui/CustomSelect'

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none"
const TABS = ['Dashboard', 'Register Birth', 'All Registers']

export default function BirthRegisterPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState(0)
  const [motherId, setMotherId] = useState('')
  const [certModal, setCertModal] = useState<{ babyId: number } | null>(null)
  const certForm = useForm<any>()

  const form = useForm<any>({
    defaultValues: {
      delivery_type: 'normal_vaginal',
      babies: [{ gender: 'female', birth_status: 'live_birth' }],
    },
  })
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'babies' })

  const { data: dashboard } = useQuery({
    queryKey: ['birth-dashboard'],
    queryFn: () => birthRegisterService.getDashboard().then(r => r.data),
    refetchInterval: 30000,
  })
  const { data: registers } = useQuery({
    queryKey: ['birth-registers'],
    queryFn: () => birthRegisterService.list().then(r => r.data),
    enabled: tab === 2,
  })

  const registerBirth = useMutation({
    mutationFn: (d: any) => birthRegisterService.register(cleanPayload({ ...d, mother_patient_id: parseInt(motherId) })),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['birth-dashboard', 'birth-registers'] })
      form.reset({ delivery_type: 'normal_vaginal', babies: [{ gender: 'female', birth_status: 'live_birth' }] })
      setMotherId('')
      toast.success('Birth registered')
      setTab(2)
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Registration failed'),
  })

  const issueCert = useMutation({
    mutationFn: (d: any) => birthRegisterService.issueCertificate(certModal!.babyId, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['birth-registers', 'birth-dashboard'] })
      certForm.reset()
      setCertModal(null)
      toast.success('Certificate issued')
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Failed to issue certificate'),
  })

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 className="page-title">Birth Register</h1>
        <p style={{ color: '#8B5CF6', fontSize: 13 }}>Delivery records · Baby details · Birth certificates</p>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid #F3F0FF' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{ padding: '8px 18px', fontSize: 13, fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer', marginBottom: -2, borderBottom: tab === i ? '2px solid #7C3AED' : '2px solid transparent', color: tab === i ? '#7C3AED' : '#9CA3AF' }}>
            {t}
          </button>
        ))}
      </div>

      {/* DASHBOARD */}
      {tab === 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
          {[
            { label: 'Births Today', value: dashboard?.births_today ?? 0, icon: Baby, color: '#7C3AED', bg: '#F5F3FF' },
            { label: 'Babies Today', value: dashboard?.total_babies_today ?? 0, icon: Users, color: '#1D4ED8', bg: '#EFF6FF' },
            { label: 'Live Births Today', value: dashboard?.live_births_today ?? 0, icon: Baby, color: '#15803D', bg: '#F0FDF4' },
            { label: 'Pending Certificates', value: dashboard?.pending_certificates ?? 0, icon: FileCheck, color: '#D97706', bg: '#FFFBEB' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={17} color={color} />
                </div>
                <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>{label}</span>
              </div>
              <p style={{ fontSize: 26, fontWeight: 700, color: '#1E1B4B' }}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* REGISTER BIRTH */}
      {tab === 1 && (
        <div className="card" style={{ maxWidth: 640, padding: 20 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1E1B4B', marginBottom: 16 }}>Register Birth</h2>
          <form onSubmit={form.handleSubmit(d => {
            if (!motherId) return toast.error('Please select the mother')
            registerBirth.mutate(d)
          })} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4C1D95', marginBottom: 4 }}>Mother *</label>
              <PatientSearchInput inputCls={inputCls} onChange={setMotherId} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4C1D95', marginBottom: 4 }}>Delivery Type</label>
                <CustomSelect value={form.watch('delivery_type') || 'normal_vaginal'} onChange={v => form.setValue('delivery_type', String(v))}
                  options={[{ value: 'normal_vaginal', label: 'Normal Vaginal' }, { value: 'cesarean', label: 'Cesarean' }, { value: 'assisted_vaginal', label: 'Assisted Vaginal' }]} />
              </div>
              <input {...form.register('gravida')} type="number" className={inputCls} placeholder="Gravida" />
              <input {...form.register('para')} type="number" className={inputCls} placeholder="Para" />
            </div>
            <textarea {...form.register('complications')} className={inputCls} rows={2} placeholder="Complications (if any)" />

            <div style={{ borderTop: '1px solid #F3F0FF', paddingTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <h3 style={{ fontSize: 12, fontWeight: 700, color: '#1E1B4B' }}>Baby Details {fields.length > 1 ? `(${fields.length} babies)` : ''}</h3>
                <button type="button" className="btn-ghost" style={{ fontSize: 11, padding: '3px 10px' }}
                  onClick={() => append({ gender: 'female', birth_status: 'live_birth' })}>
                  <Plus size={12} style={{ marginRight: 3, display: 'inline' }} /> Add Baby (Twins)
                </button>
              </div>

              {fields.map((field, idx) => (
                <div key={field.id} style={{ background: '#FAF5FF', borderRadius: 10, padding: 12, marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#4C1D95' }}>Baby {idx + 1}</span>
                    {fields.length > 1 && (
                      <button type="button" onClick={() => remove(idx)}><Trash2 size={13} color="#DC2626" /></button>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                    <CustomSelect value={form.watch(`babies.${idx}.gender`) || 'female'} onChange={v => form.setValue(`babies.${idx}.gender`, String(v))}
                      options={[{ value: 'female', label: 'Female' }, { value: 'male', label: 'Male' }, { value: 'ambiguous', label: 'Ambiguous' }]} />
                    <CustomSelect value={form.watch(`babies.${idx}.birth_status`) || 'live_birth'} onChange={v => form.setValue(`babies.${idx}.birth_status`, String(v))}
                      options={[{ value: 'live_birth', label: 'Live Birth' }, { value: 'stillbirth', label: 'Stillbirth' }]} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
                    <input {...form.register(`babies.${idx}.birth_weight_grams`)} type="number" className={inputCls} placeholder="Weight (g)" />
                    <input {...form.register(`babies.${idx}.birth_length_cm`)} type="number" step="0.1" className={inputCls} placeholder="Length (cm)" />
                    <input {...form.register(`babies.${idx}.apgar_score_1min`)} type="number" className={inputCls} placeholder="APGAR 1min" />
                    <input {...form.register(`babies.${idx}.apgar_score_5min`)} type="number" className={inputCls} placeholder="APGAR 5min" />
                  </div>
                </div>
              ))}
            </div>

            <button type="submit" disabled={registerBirth.isPending} className="btn-primary">
              {registerBirth.isPending ? 'Registering...' : 'Register Birth'}
            </button>
          </form>
        </div>
      )}

      {/* ALL REGISTERS */}
      {tab === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {!registers?.length && (
            <div className="card" style={{ padding: 32, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>No birth records yet</div>
          )}
          {registers?.map((r: any) => (
            <div key={r.id} className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#1E1B4B' }}>{r.birth_register_number}</p>
                  <p style={{ fontSize: 12, color: '#6B7280' }}>{format(new Date(r.delivery_datetime), 'HH:mm, dd MMM yyyy')} · {r.delivery_type.replace(/_/g, ' ')}</p>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {r.babies.map((b: any) => (
                  <div key={b.id} style={{ background: '#FAF5FF', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
                    <span style={{ fontWeight: 600, color: '#4C1D95' }}>{b.baby_name || `Baby (${b.gender})`}</span>
                    {' · '}{b.birth_weight_grams ? `${b.birth_weight_grams}g` : '—'}
                    {b.certificate_issued ? (
                      <span style={{ marginLeft: 8, color: '#15803D', fontWeight: 600 }}>✓ Certificate: {b.certificate_number}</span>
                    ) : (
                      <button className="btn-ghost" style={{ fontSize: 10, padding: '2px 8px', marginLeft: 8 }}
                        onClick={() => setCertModal({ babyId: b.id })}>
                        Issue Certificate
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {certModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }} onClick={() => setCertModal(null)}>
          <div className="card" style={{ width: 380, padding: 20 }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1E1B4B', marginBottom: 16 }}>Issue Birth Certificate</h2>
            <form onSubmit={certForm.handleSubmit(d => issueCert.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input {...certForm.register('certificate_number', { required: true })} className={inputCls} placeholder="Certificate Number" />
              <button type="submit" disabled={issueCert.isPending} className="btn-primary">
                {issueCert.isPending ? 'Issuing...' : 'Issue Certificate'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

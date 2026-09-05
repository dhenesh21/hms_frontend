import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { ipdService, dietService } from '../../services/api'
import { ArrowLeft, Thermometer, Heart, Plus, FileText, Activity, Printer } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { cleanPayload } from '../../utils/form'

import { printDischargeSummary } from '../../utils/print'
import CustomSelect from '../../components/ui/CustomSelect'
const TABS = ['Overview', 'Vitals Chart', 'Nursing Notes', 'Progress Notes', 'Bed Transfer', 'Diet Chart']

function InfoRow({ label, value }: any) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm font-medium text-gray-800">{value || '—'}</p>
    </div>
  )
}

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none"

export default function IPDAdmissionDetail() {
  const { admissionId: id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [tab, setTab] = useState(0)

  const validId = !!id && !isNaN(Number(id))

  const { data: admission, isLoading } = useQuery({
    queryKey: ['admission', id],
    queryFn: () => ipdService.getAdmission(Number(id)).then(r => r.data),
    enabled: validId
  })

  const { data: vitals } = useQuery({
    queryKey: ['vitals', id],
    queryFn: () => ipdService.getVitals(Number(id)).then(r => r.data),
    enabled: validId
  })

  const { data: nursingNotes } = useQuery({
    queryKey: ['nursing-notes', id],
    queryFn: () => ipdService.getNursingNotes(Number(id)).then(r => r.data),
    enabled: validId
  })

  const { data: progressNotes } = useQuery({
    queryKey: ['progress-notes', id],
    queryFn: () => ipdService.getProgressNotes(Number(id)).then(r => r.data),
    enabled: validId
  })

  const vitalForm = useForm()
  const nursingForm = useForm()
  const progressForm = useForm()

  const recordVital = useMutation({
    mutationFn: (d: any) => ipdService.recordVitals(cleanPayload({ ...d, admission_id: Number(id) })),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vitals'] }); vitalForm.reset(); toast.success('Vitals recorded') },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to record vitals')
  })

  const addNote = useMutation({
    mutationFn: (d: any) => ipdService.addNursingNote(cleanPayload({ ...d, admission_id: Number(id) })),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['nursing-notes'] }); nursingForm.reset(); toast.success('Note added') },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to add note')
  })

  const addProgress = useMutation({
    mutationFn: (d: any) => ipdService.addProgressNote(cleanPayload({ ...d, admission_id: Number(id) })),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['progress-notes'] }); progressForm.reset(); toast.success('Progress note added') },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to add progress note')
  })

  // Bed Transfer state
  const [transferWardId, setTransferWardId] = useState('')
  const [transferBedId, setTransferBedId] = useState('')
  const [transferReason, setTransferReason] = useState('')

  const { data: allWards } = useQuery({ queryKey: ['wards-transfer'], queryFn: () => ipdService.listWards().then(r => r.data), enabled: tab === 4 })
  const { data: wardBeds } = useQuery({ queryKey: ['ward-beds', transferWardId], queryFn: () => ipdService.getWardBeds(Number(transferWardId), 'available').then(r => r.data), enabled: !!transferWardId && tab === 4 })

  const bedTransfer = useMutation({
    mutationFn: (d: any) => ipdService.transferBed(Number(id), d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admission', id] }); setTransferBedId(''); setTransferWardId(''); setTransferReason(''); toast.success('Patient transferred!') },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Transfer failed')
  })

  // Diet Chart state
  const [dietType, setDietType] = useState('normal')
  const [dietInstructions, setDietInstructions] = useState('')

  const { data: dietChart, refetch: refetchDiet } = useQuery({ queryKey: ['diet-chart', id], queryFn: () => dietService.getChart(Number(id)).then(r => r.data), enabled: tab === 5 })

  const createDiet = useMutation({
    mutationFn: () => dietService.createChart({ admission_id: Number(id), patient_id: admission.patient_id, diet_type: dietType, special_instructions: dietInstructions }),
    onSuccess: () => { refetchDiet(); toast.success('Diet chart created!') },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed')
  })

  const markServed = useMutation({ mutationFn: (mealId: number) => dietService.markServed(mealId), onSuccess: () => refetchDiet() })
  const markConsumed = useMutation({ mutationFn: ({ mealId, consumed }: any) => dietService.markConsumed(mealId, { consumed }), onSuccess: () => refetchDiet() })

  const STATUS_COLORS: Record<string, string> = {
    admitted: 'bg-green-100 text-green-700',
    discharged: 'bg-gray-100 text-gray-600',
    transferred: 'bg-blue-100 text-blue-700',
    expired: 'bg-red-100 text-red-700',
    lama: 'bg-amber-100 text-amber-700',
  }

  const chartData = vitals?.slice().reverse().map((v: any) => ({
    time: format(new Date(v.recorded_at), 'HH:mm dd/MM'),
    temp: v.temperature,
    pulse: v.pulse_rate,
    spo2: v.oxygen_saturation,
    bp_sys: v.blood_pressure_systolic,
  })) || []

  if (!validId) return <div className="text-center py-20 text-gray-400">Invalid admission ID</div>
  if (isLoading) return <div className="text-center py-20 text-gray-400">Loading...</div>
  if (!admission) return <div className="text-center py-20 text-gray-400">Admission not found</div>

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => navigate('/ipd')} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="page-title">IPD Admission</h1>
            <p className="text-sm text-gray-500">{admission.admission_number} · <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[admission.status] || 'bg-gray-100 text-gray-600'}`}>{admission.status.toUpperCase()}</span></p>
          </div>
        </div>
        <button onClick={() => printDischargeSummary(admission)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: 13, fontWeight: 600, borderRadius: 8, border: '1.5px solid #DDD6FE', background: '#F5F3FF', color: '#7C3AED', cursor: 'pointer' }}>
          <Printer size={14} /> Discharge Summary
        </button>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <InfoRow label="Admission Type" value={admission.admission_type?.replace('_', ' ')} />
          <InfoRow label="Diagnosis" value={admission.diagnosis_at_admission} />
          <InfoRow label="Insurance" value={admission.insurance_provider} />
          <InfoRow label="Expected Discharge" value={admission.expected_discharge_date
            ? format(new Date(admission.expected_discharge_date), 'dd MMM yyyy') : 'TBD'} />
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100">
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)}
              className={`px-5 py-3 text-sm font-medium transition border-b-2
                ${tab === i ? 'border-blue-600 text-blue-700' : 'border-transparent tab'}`}>
              {t}
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* Overview */}
          {tab === 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <InfoRow label="Chief Complaint" value={admission.chief_complaint} />
                <InfoRow label="Discharge Diagnosis" value={admission.discharge_diagnosis} />
              </div>
              {admission.discharge_summary && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Discharge Summary</p>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{admission.discharge_summary}</p>
                </div>
              )}
            </div>
          )}

          {/* Vitals Chart */}
          {tab === 1 && (
            <div className="space-y-5">
              {/* Record vitals form */}
              <form onSubmit={vitalForm.handleSubmit(d => recordVital.mutate(d))}
                className="grid grid-cols-4 gap-3 bg-gray-50 p-4 rounded-lg">
                {[
                  { name: 'temperature', label: 'Temp (°F)', placeholder: '98.6' },
                  { name: 'pulse_rate', label: 'Pulse (bpm)', placeholder: '72' },
                  { name: 'blood_pressure_systolic', label: 'BP Sys', placeholder: '120' },
                  { name: 'blood_pressure_diastolic', label: 'BP Dia', placeholder: '80' },
                  { name: 'oxygen_saturation', label: 'SpO2 (%)', placeholder: '98' },
                  { name: 'blood_sugar', label: 'Blood Sugar', placeholder: '110' },
                  { name: 'pain_score', label: 'Pain (0-10)', placeholder: '0' },
                  { name: 'urine_output_ml', label: 'Urine (ml)', placeholder: '500' },
                ].map(({ name, label, placeholder }) => (
                  <div key={name}>
                    <label className="block text-xs text-gray-500 mb-1">{label}</label>
                    <input {...vitalForm.register(name)} type="number" step="0.1"
                      placeholder={placeholder} className={inputCls} />
                  </div>
                ))}
                <div className="col-span-4 flex justify-end">
                  <button type="submit" className="px-4 py-2 btn-primary">
                    Record Vitals
                  </button>
                </div>
              </form>

              {/* Chart */}
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="temp" stroke="#ef4444" name="Temp" dot={false} strokeWidth={2} />
                    <Line type="monotone" dataKey="pulse" stroke="#3b82f6" name="Pulse" dot={false} strokeWidth={2} />
                    <Line type="monotone" dataKey="spo2" stroke="#10b981" name="SpO2" dot={false} strokeWidth={2} />
                    <Line type="monotone" dataKey="bp_sys" stroke="#f59e0b" name="BP Sys" dot={false} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-gray-400 py-8">No vitals recorded yet</p>
              )}
            </div>
          )}

          {/* Nursing Notes */}
          {tab === 2 && (
            <div className="space-y-4">
              <form onSubmit={nursingForm.handleSubmit(d => addNote.mutate(d))}
                className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Note Type</label>
                    <CustomSelect value={nursingForm.watch('note_type') || ''} onChange={v => nursingForm.setValue('note_type', String(v))} placeholder="— Select —" options={[{ value: '', label: '— Select —' }, { value: "general", label: "General" }, { value: "medication", label: "Medication" }, { value: "observation", label: "Observation" }]} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Shift</label>
                    <CustomSelect value={nursingForm.watch('shift') || ''} onChange={v => nursingForm.setValue('shift', String(v))} placeholder="— Select —" options={[{ value: '', label: '— Select —' }, { value: "morning", label: "Morning" }, { value: "afternoon", label: "Afternoon" }, { value: "night", label: "Night" }]} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Note *</label>
                  <textarea {...nursingForm.register('note', { required: true })} rows={3}
                    className={inputCls} placeholder="Enter nursing note..." />
                </div>
                <div className="flex justify-end">
                  <button type="submit" className="px-4 py-2 btn-primary">
                    Add Note
                  </button>
                </div>
              </form>

              <div className="space-y-2">
                {nursingNotes?.map((n: any) => (
                  <div key={n.id} className="border border-gray-100 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex gap-2">
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full capitalize">{n.note_type}</span>
                        {n.shift && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">{n.shift}</span>}
                      </div>
                      <span className="text-xs text-gray-400">{format(new Date(n.created_at), 'dd MMM, HH:mm')}</span>
                    </div>
                    <p className="text-sm text-gray-700">{n.note}</p>
                  </div>
                ))}
                {nursingNotes?.length === 0 && <p className="text-center text-gray-400 py-6">No nursing notes</p>}
              </div>
            </div>
          )}

          {/* Progress Notes (SOAP) */}
          {tab === 3 && (
            <div className="space-y-4">
              <form onSubmit={progressForm.handleSubmit(d => addProgress.mutate(d))}
                className="bg-gray-50 p-4 rounded-lg space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">SOAP Note</p>
                {[
                  { name: 'subjective', label: 'S — Subjective (Patient complaints)', placeholder: 'Patient reports...' },
                  { name: 'objective', label: 'O — Objective (Examination findings)', placeholder: 'On examination...' },
                  { name: 'assessment', label: 'A — Assessment', placeholder: 'Assessment...' },
                  { name: 'plan', label: 'P — Plan', placeholder: 'Continue...' },
                ].map(({ name, label, placeholder }) => (
                  <div key={name}>
                    <label className="block text-xs text-gray-500 mb-1">{label}</label>
                    <textarea {...progressForm.register(name)} rows={2}
                      className={inputCls} placeholder={placeholder} />
                  </div>
                ))}
                <div className="flex justify-end">
                  <button type="submit" className="px-4 py-2 btn-primary">
                    Save SOAP Note
                  </button>
                </div>
              </form>

              <div className="space-y-3">
                {progressNotes?.map((n: any) => (
                  <div key={n.id} className="border border-gray-100 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-gray-500">
                        {format(new Date(n.note_date), 'dd MMM yyyy')}
                      </span>
                      <span className="text-xs text-gray-400">{format(new Date(n.created_at), 'HH:mm')}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[['S', n.subjective], ['O', n.objective], ['A', n.assessment], ['P', n.plan]].map(([k, v]) => v ? (
                        <div key={k}>
                          <p className="text-xs font-bold text-blue-600 mb-0.5">{k}</p>
                          <p className="text-sm text-gray-700">{v}</p>
                        </div>
                      ) : null)}
                    </div>
                  </div>
                ))}
                {progressNotes?.length === 0 && <p className="text-center text-gray-400 py-6">No progress notes</p>}
              </div>
            </div>
          )}

          {/* BED TRANSFER TAB */}
          {tab === 4 && (
            <div className="space-y-4">
              <div style={{ padding: '14px 16px', background: '#F5F3FF', borderRadius: 10, border: '1px solid #EDE9FE' }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#4C1D95', marginBottom: 8, textTransform: 'uppercase' }}>Current Location</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div><p style={{ fontSize: 11, color: '#9CA3AF' }}>Ward</p><p style={{ fontSize: 13, fontWeight: 600, color: '#1E1B4B' }}>{admission.ward_name || `Ward #${admission.ward_id}` || '—'}</p></div>
                  <div><p style={{ fontSize: 11, color: '#9CA3AF' }}>Bed</p><p style={{ fontSize: 13, fontWeight: 600, color: '#1E1B4B' }}>{admission.bed_number || `Bed #${admission.bed_id}` || '—'}</p></div>
                  <div><p style={{ fontSize: 11, color: '#9CA3AF' }}>Since</p><p style={{ fontSize: 13, fontWeight: 600, color: '#1E1B4B' }}>{admission.admission_date ? new Date(admission.admission_date).toLocaleDateString('en-IN') : '—'}</p></div>
                </div>
              </div>
              <div className="card">
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1E1B4B', marginBottom: 16 }}>Transfer to New Bed</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Ward *</label>
                    <select value={transferWardId} onChange={e => { setTransferWardId(e.target.value); setTransferBedId('') }} className={inputCls} style={{ background: '#fff' }}>
                      <option value="">— Select Ward —</option>
                      {allWards?.map((w: any) => <option key={w.id} value={w.id}>{w.name} ({w.available_beds} free)</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Bed *</label>
                    <select value={transferBedId} onChange={e => setTransferBedId(e.target.value)} className={inputCls} style={{ background: '#fff' }} disabled={!transferWardId}>
                      <option value="">— Select Bed —</option>
                      {wardBeds?.map((b: any) => <option key={b.id} value={b.id}>{b.bed_number} ({b.bed_type})</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label className="block text-xs text-gray-500 mb-1">Reason *</label>
                  <textarea value={transferReason} onChange={e => setTransferReason(e.target.value)} rows={2} className={inputCls} placeholder="e.g. Condition improved, moving to general ward..." />
                </div>
                <button onClick={() => { if (!transferBedId || !transferWardId) return toast.error('Select ward and bed'); if (!transferReason.trim()) return toast.error('Enter reason'); bedTransfer.mutate({ bed_id: parseInt(transferBedId), ward_id: parseInt(transferWardId), reason: transferReason }) }} disabled={bedTransfer.isPending}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', fontSize: 13, fontWeight: 600, borderRadius: 8, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#7C3AED,#4F46E5)', color: '#fff', opacity: bedTransfer.isPending ? 0.7 : 1 }}>
                  {bedTransfer.isPending ? 'Transferring...' : '🔄 Transfer Patient'}
                </button>
              </div>
            </div>
          )}

          {/* DIET CHART TAB */}
          {tab === 5 && (
            <div className="space-y-4">
              {!dietChart ? (
                <div className="card">
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1E1B4B', marginBottom: 16 }}>Prescribe Diet</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Diet Type</label>
                      <select value={dietType} onChange={e => setDietType(e.target.value)} className={inputCls} style={{ background: '#fff' }}>
                        {['normal','soft','liquid','npo','diabetic','low_sodium','high_protein','low_fat','renal'].map(d => <option key={d} value={d}>{d.replace('_',' ').toUpperCase()}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Special Instructions</label>
                      <input value={dietInstructions} onChange={e => setDietInstructions(e.target.value)} className={inputCls} placeholder="Allergies, preferences..." />
                    </div>
                  </div>
                  <button onClick={() => createDiet.mutate()} disabled={createDiet.isPending}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', fontSize: 13, fontWeight: 600, borderRadius: 8, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#7C3AED,#4F46E5)', color: '#fff' }}>
                    {createDiet.isPending ? 'Creating...' : '🍽 Create Diet Chart'}
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#F5F3FF', borderRadius: 10, border: '1px solid #EDE9FE', marginBottom: 16 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#4C1D95' }}>Diet: {dietChart.diet_type?.replace('_',' ').toUpperCase()}</span>
                    <button onClick={() => createDiet.mutate()} style={{ fontSize: 12, padding: '6px 12px', borderRadius: 6, border: '1.5px solid #DDD6FE', background: '#fff', color: '#7C3AED', cursor: 'pointer', fontWeight: 600 }}>Change Diet</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {(dietChart.meals || []).filter((m: any) => m.meal_date === new Date().toISOString().split('T')[0]).map((meal: any) => (
                      <div key={meal.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', background: '#FAFAFF', border: '1px solid #EDE9FE', borderRadius: 10 }}>
                        <div style={{ width: 90, flexShrink: 0 }}><span style={{ fontSize: 11, fontWeight: 700, color: '#7C3AED', textTransform: 'uppercase' }}>{meal.meal_type?.replace('_',' ')}</span></div>
                        <div style={{ flex: 1, fontSize: 13, color: '#374151' }}>{meal.items}</div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => markServed.mutate(meal.id)} disabled={meal.served} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: '1px solid', borderColor: meal.served ? '#A7F3D0' : '#DDD6FE', background: meal.served ? '#ECFDF5' : '#F5F3FF', color: meal.served ? '#059669' : '#7C3AED', cursor: meal.served ? 'default' : 'pointer', fontWeight: 600 }}>{meal.served ? '✓ Served' : 'Mark Served'}</button>
                          {meal.served && <button onClick={() => markConsumed.mutate({ mealId: meal.id, consumed: !meal.consumed })} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: '1px solid', borderColor: meal.consumed ? '#A7F3D0' : '#FDE68A', background: meal.consumed ? '#ECFDF5' : '#FFFBEB', color: meal.consumed ? '#059669' : '#D97706', cursor: 'pointer', fontWeight: 600 }}>{meal.consumed ? '✓ Consumed' : 'Mark Consumed'}</button>}
                        </div>
                      </div>
                    ))}
                    {!(dietChart.meals || []).some((m: any) => m.meal_date === new Date().toISOString().split('T')[0]) && <p style={{ textAlign: 'center', padding: 32, color: '#C4B5FD', fontSize: 13 }}>No meals for today</p>}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

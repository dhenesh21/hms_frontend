import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { ipdService } from '../../services/api'
import { ArrowLeft, Thermometer, Heart, Plus, FileText, Activity } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const TABS = ['Overview', 'Vitals Chart', 'Nursing Notes', 'Progress Notes']

function InfoRow({ label, value }: any) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm font-medium text-gray-800">{value || '—'}</p>
    </div>
  )
}

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"

export default function IPDAdmissionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [tab, setTab] = useState(0)

  const { data: admission, isLoading } = useQuery({
    queryKey: ['admission', id],
    queryFn: () => ipdService.getAdmission(Number(id)).then(r => r.data)
  })

  const { data: vitals } = useQuery({
    queryKey: ['vitals', id],
    queryFn: () => ipdService.getVitals(Number(id)).then(r => r.data)
  })

  const { data: nursingNotes } = useQuery({
    queryKey: ['nursing-notes', id],
    queryFn: () => ipdService.getNursingNotes(Number(id)).then(r => r.data)
  })

  const { data: progressNotes } = useQuery({
    queryKey: ['progress-notes', id],
    queryFn: () => ipdService.getProgressNotes(Number(id)).then(r => r.data)
  })

  const vitalForm = useForm()
  const nursingForm = useForm()
  const progressForm = useForm()

  const recordVital = useMutation({
    mutationFn: (d: any) => ipdService.recordVitals({ ...d, admission_id: Number(id) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vitals'] }); vitalForm.reset(); toast.success('Vitals recorded') }
  })

  const addNote = useMutation({
    mutationFn: (d: any) => ipdService.addNursingNote({ ...d, admission_id: Number(id) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['nursing-notes'] }); nursingForm.reset(); toast.success('Note added') }
  })

  const addProgress = useMutation({
    mutationFn: (d: any) => ipdService.addProgressNote({ ...d, admission_id: Number(id) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['progress-notes'] }); progressForm.reset(); toast.success('Progress note added') }
  })

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

  if (isLoading) return <div className="text-center py-20 text-gray-400">Loading...</div>
  if (!admission) return <div className="text-center py-20 text-gray-400">Admission not found</div>

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/ipd')} className="p-1.5 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">{admission.admission_number}</h1>
          <p className="text-sm text-gray-500">
            Admitted: {format(new Date(admission.admission_date), 'dd MMM yyyy, hh:mm a')}
          </p>
        </div>
        <span className={`text-xs px-3 py-1 rounded-full font-medium ${STATUS_COLORS[admission.status] || 'bg-gray-100 text-gray-600'}`}>
          {admission.status.toUpperCase()}
        </span>
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
                ${tab === i ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
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
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
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
                    <select {...nursingForm.register('note_type')} className={`${inputCls} bg-white`}>
                      <option value="general">General</option>
                      <option value="medication">Medication</option>
                      <option value="observation">Observation</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Shift</label>
                    <select {...nursingForm.register('shift')} className={`${inputCls} bg-white`}>
                      <option value="morning">Morning</option>
                      <option value="afternoon">Afternoon</option>
                      <option value="night">Night</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Note *</label>
                  <textarea {...nursingForm.register('note', { required: true })} rows={3}
                    className={inputCls} placeholder="Enter nursing note..." />
                </div>
                <div className="flex justify-end">
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
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
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
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
        </div>
      </div>
    </div>
  )
}

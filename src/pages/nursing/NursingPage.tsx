import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { nursingService } from '../../services/api'
import { Pill, ClipboardList, Heart, Users, AlertTriangle, CheckCircle, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
const TABS = ['MAR', 'Pending Doses', 'Assessment', 'Care Plans', 'Handover']

const DOSE_STATUS_COLORS: Record<string, string> = {
  given: 'bg-green-100 text-green-700',
  missed: 'bg-red-100 text-red-700',
  refused: 'bg-orange-100 text-orange-700',
  held: 'bg-amber-100 text-amber-700',
  scheduled: 'bg-gray-100 text-gray-600',
}

export default function NursingPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState(0)
  const [admissionId, setAdmissionId] = useState('')
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null)
  const { register, handleSubmit, reset } = useForm()
  const marForm = useForm()
  const assessForm = useForm()
  const planForm = useForm()
  const handoverForm = useForm()
  const interventionForm = useForm()

  const id = admissionId ? parseInt(admissionId) : 0

  const { data: marList } = useQuery({
    queryKey: ['mar', id], enabled: id > 0,
    queryFn: () => nursingService.getMARForAdmission(id).then(r => r.data)
  })

  const { data: pendingDoses } = useQuery({
    queryKey: ['pending-doses', id], enabled: id > 0,
    queryFn: () => nursingService.getPendingDoses(id).then(r => r.data)
  })

  const { data: assessments } = useQuery({
    queryKey: ['assessments', id], enabled: id > 0,
    queryFn: () => nursingService.getAssessments(id).then(r => r.data)
  })

  const { data: carePlans } = useQuery({
    queryKey: ['care-plans', id], enabled: id > 0,
    queryFn: () => nursingService.getCarePlans(id).then(r => r.data)
  })

  const { data: handovers } = useQuery({
    queryKey: ['handovers'],
    queryFn: () => nursingService.listHandovers({ shift_date: format(new Date(), 'yyyy-MM-dd') }).then(r => r.data)
  })

  const { data: nursingStats } = useQuery({
    queryKey: ['nursing-stats', id], enabled: id > 0,
    queryFn: () => nursingService.getDashboard(id).then(r => r.data)
  })

  const createMAR = useMutation({
    mutationFn: (d: any) => nursingService.createMAR({
      ...d, ipd_admission_id: id, patient_id: parseInt(d.patient_id),
      ordered_by: d.ordered_by ? parseInt(d.ordered_by) : undefined,
      start_date: d.start_date,
      scheduled_times: d.scheduled_times?.split(',').map((t: string) => t.trim()) || []
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['mar', id] }); marForm.reset(); toast.success('MAR created') }
  })

  const administerDose = useMutation({
    mutationFn: ({ marId, scheduledTime, status }: any) => nursingService.recordAdministration({
      mar_id: marId,
      scheduled_datetime: scheduledTime,
      status,
      dose_given: status === 'given' ? 'As prescribed' : undefined,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pending-doses', id] }); toast.success('Dose recorded') }
  })

  const createAssessment = useMutation({
    mutationFn: (d: any) => nursingService.createAssessment({
      ...d, ipd_admission_id: id,
      patient_id: parseInt(d.patient_id),
      pain_score: d.pain_score ? parseInt(d.pain_score) : undefined,
      fall_risk_score: d.fall_risk_score ? parseInt(d.fall_risk_score) : undefined,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['assessments', id] }); assessForm.reset(); toast.success('Assessment saved') }
  })

  const createPlan = useMutation({
    mutationFn: (d: any) => nursingService.createCarePlan({
      ...d, ipd_admission_id: id,
      patient_id: parseInt(d.patient_id),
      interventions: d.interventions?.split('\n').filter(Boolean) || []
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['care-plans', id] }); planForm.reset(); toast.success('Care plan created') }
  })

  const addIntervention = useMutation({
    mutationFn: (d: any) => nursingService.addIntervention(selectedPlanId!, d),
    onSuccess: () => { interventionForm.reset(); setSelectedPlanId(null); toast.success('Intervention recorded') }
  })

  const createHandover = useMutation({
    mutationFn: (d: any) => nursingService.createHandover({
      ...d,
      total_patients: parseInt(d.total_patients || 0),
      critical_patients: parseInt(d.critical_patients || 0),
      pending_tasks: d.pending_tasks?.split('\n').filter(Boolean) || [],
      critical_alerts: d.critical_alerts?.split('\n').filter(Boolean) || [],
      patient_summaries: []
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['handovers'] }); handoverForm.reset(); toast.success('Handover created') }
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold text-gray-900">Nursing Module</h1>
          <p className="text-sm text-gray-500">MAR · Medication · Assessment · Care Plans · Handover</p></div>
      </div>

      {/* Admission ID input */}
      <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
        <label className="text-sm font-medium text-gray-700 whitespace-nowrap">IPD Admission ID:</label>
        <input type="number" value={admissionId} onChange={e => setAdmissionId(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-40"
          placeholder="Enter ID" />
        {id > 0 && nursingStats && (
          <div className="flex gap-4 ml-4">
            {[
              { label: 'Active Meds', value: nursingStats.active_medications, color: 'text-blue-600' },
              { label: 'Pending Doses', value: nursingStats.pending_doses_today, color: 'text-amber-600' },
              { label: 'Care Plans', value: nursingStats.active_care_plans, color: 'text-green-600' },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center">
                <p className={`text-lg font-bold ${color}`}>{value}</p>
                <p className="text-xs text-gray-400">{label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition
              ${tab === i ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t}
            {t === 'Pending Doses' && pendingDoses?.length > 0 && (
              <span className="ml-1.5 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">{pendingDoses.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* MAR */}
      {tab === 0 && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Add Medication Order (MAR)</h2>
            <form onSubmit={marForm.handleSubmit(d => createMAR.mutate(d))} className="grid grid-cols-3 gap-3">
              <div><label className="block text-xs text-gray-500 mb-1">Patient ID *</label>
                <input {...marForm.register('patient_id', { required: true })} type="number" className={inputCls} /></div>
              <div><label className="block text-xs text-gray-500 mb-1">Drug Name *</label>
                <input {...marForm.register('drug_name', { required: true })} className={inputCls} placeholder="Paracetamol" /></div>
              <div><label className="block text-xs text-gray-500 mb-1">Generic Name</label>
                <input {...marForm.register('generic_name')} className={inputCls} /></div>
              <div><label className="block text-xs text-gray-500 mb-1">Dose *</label>
                <input {...marForm.register('dose', { required: true })} className={inputCls} placeholder="500mg" /></div>
              <div><label className="block text-xs text-gray-500 mb-1">Route</label>
                <select {...marForm.register('route')} className={`${inputCls} bg-white`}>
                  {['oral','iv','im','sc','topical','sublingual','inhaled'].map(r => <option key={r}>{r}</option>)}
                </select></div>
              <div><label className="block text-xs text-gray-500 mb-1">Frequency</label>
                <select {...marForm.register('frequency')} className={`${inputCls} bg-white`}>
                  {['once_daily','twice_daily','thrice_daily','four_times_daily','every_6_hours','every_8_hours','every_12_hours','sos','stat'].map(f => (
                    <option key={f} value={f}>{f.replace(/_/g,' ')}</option>
                  ))}
                </select></div>
              <div><label className="block text-xs text-gray-500 mb-1">Scheduled Times (comma separated)</label>
                <input {...marForm.register('scheduled_times')} className={inputCls} placeholder="06:00, 14:00, 22:00" /></div>
              <div><label className="block text-xs text-gray-500 mb-1">Start Date *</label>
                <input {...marForm.register('start_date', { required: true })} type="date" className={inputCls} defaultValue={format(new Date(), 'yyyy-MM-dd')} /></div>
              <div><label className="block text-xs text-gray-500 mb-1">End Date</label>
                <input {...marForm.register('end_date')} type="date" className={inputCls} /></div>
              <div className="col-span-3"><label className="block text-xs text-gray-500 mb-1">Instructions</label>
                <textarea {...marForm.register('instructions')} rows={2} className={inputCls} placeholder="Take after food..." /></div>
              <div className="col-span-3 flex justify-end">
                <button type="submit" className="px-5 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Add to MAR</button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100"><h2 className="text-sm font-semibold text-gray-700">Current MAR ({marList?.length ?? 0})</h2></div>
            <table className="w-full">
              <thead><tr className="bg-gray-50">
                {['Drug','Dose','Route','Frequency','Times','Start','Status'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-2">{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {marList?.map((m: any) => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3"><p className="text-sm font-medium text-gray-900">{m.drug_name}</p>
                      {m.generic_name && <p className="text-xs text-gray-400">{m.generic_name}</p>}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{m.dose}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 capitalize">{m.route}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{m.frequency?.replace(/_/g,' ')}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{m.scheduled_times?.join(', ')}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{m.start_date}</td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${m.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{m.is_active ? 'Active' : 'D/C'}</span></td>
                  </tr>
                ))}
                {!marList?.length && <tr><td colSpan={7} className="text-center py-8 text-gray-400">No medications ordered. Enter Admission ID above.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PENDING DOSES */}
      {tab === 1 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">Today's Pending Doses ({pendingDoses?.length ?? 0})</h2>
            <span className="text-xs text-gray-400">{format(new Date(), 'dd MMM yyyy')}</span>
          </div>
          <div className="divide-y divide-gray-50">
            {pendingDoses?.map((dose: any) => (
              <div key={dose.administration_id} className="flex items-center gap-4 px-4 py-3">
                <div className="w-14 text-center flex-shrink-0">
                  <p className="text-sm font-bold text-gray-800">{dose.scheduled_time}</p>
                </div>
                <div className="w-px h-10 bg-gray-200 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">{dose.drug_name}</p>
                  {dose.instructions && <p className="text-xs text-gray-400 mt-0.5">{dose.instructions}</p>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => administerDose.mutate({ marId: dose.mar_id, scheduledTime: `${format(new Date(), 'yyyy-MM-dd')}T${dose.scheduled_time}:00`, status: 'given' })}
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700">
                    <CheckCircle size={12} /> Given
                  </button>
                  <button onClick={() => administerDose.mutate({ marId: dose.mar_id, scheduledTime: `${format(new Date(), 'yyyy-MM-dd')}T${dose.scheduled_time}:00`, status: 'missed' })}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 text-xs rounded-lg hover:bg-red-200">
                    Missed
                  </button>
                  <button onClick={() => administerDose.mutate({ marId: dose.mar_id, scheduledTime: `${format(new Date(), 'yyyy-MM-dd')}T${dose.scheduled_time}:00`, status: 'held' })}
                    className="flex items-center gap-1 px-3 py-1.5 bg-amber-100 text-amber-700 text-xs rounded-lg hover:bg-amber-200">
                    Hold
                  </button>
                </div>
              </div>
            ))}
            {!pendingDoses?.length && (
              <div className="text-center py-12">
                <CheckCircle size={36} className="mx-auto mb-3 text-green-400" />
                <p className="text-gray-400">No pending doses for this admission</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ASSESSMENT */}
      {tab === 2 && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">New Nursing Assessment</h2>
            <form onSubmit={assessForm.handleSubmit(d => createAssessment.mutate(d))} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-xs text-gray-500 mb-1">Patient ID *</label>
                  <input {...assessForm.register('patient_id', { required: true })} type="number" className={inputCls} /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Assessment Type</label>
                  <select {...assessForm.register('assessment_type')} className={`${inputCls} bg-white`}>
                    {['admission','daily','discharge','fall_risk','pain','nutritional','pressure_ulcer'].map(t => (
                      <option key={t} value={t}>{t.replace(/_/g,' ')}</option>
                    ))}
                  </select></div>
                <div><label className="block text-xs text-gray-500 mb-1">General Condition</label>
                  <select {...assessForm.register('general_condition')} className={`${inputCls} bg-white`}>
                    {['good','fair','poor','critical'].map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
                  </select></div>
                <div><label className="block text-xs text-gray-500 mb-1">Consciousness</label>
                  <select {...assessForm.register('consciousness')} className={`${inputCls} bg-white`}>
                    {['conscious','drowsy','confused','unconscious'].map(c => <option key={c}>{c}</option>)}
                  </select></div>
                <div><label className="block text-xs text-gray-500 mb-1">Pain Score (0-10)</label>
                  <input {...assessForm.register('pain_score')} type="number" min="0" max="10" className={inputCls} /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Fall Risk Score</label>
                  <input {...assessForm.register('fall_risk_score')} type="number" className={inputCls} placeholder="Morse Score" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Fall Risk Level</label>
                  <select {...assessForm.register('fall_risk_level')} className={`${inputCls} bg-white`}>
                    <option value="">Select</option>
                    {['low','moderate','high'].map(r => <option key={r}>{r}</option>)}
                  </select></div>
                <div><label className="block text-xs text-gray-500 mb-1">Braden Score</label>
                  <input {...assessForm.register('braden_score')} type="number" className={inputCls} placeholder="6-23" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Nutritional Status</label>
                  <select {...assessForm.register('nutritional_status')} className={`${inputCls} bg-white`}>
                    <option value="">Select</option>
                    {['well_nourished','at_risk','malnourished'].map(n => <option key={n}>{n.replace(/_/g,' ')}</option>)}
                  </select></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: 'respiratory', label: 'Respiratory' },
                  { name: 'cardiovascular', label: 'Cardiovascular' },
                  { name: 'neurological', label: 'Neurological' },
                  { name: 'gastrointestinal', label: 'Gastrointestinal' },
                  { name: 'iv_access', label: 'IV Access / Lines' },
                  { name: 'oxygen_therapy', label: 'Oxygen Therapy' },
                ].map(({ name, label }) => (
                  <div key={name}><label className="block text-xs text-gray-500 mb-1">{label}</label>
                    <input {...assessForm.register(name)} className={inputCls} placeholder={`${label} findings...`} /></div>
                ))}
              </div>
              <div><label className="block text-xs text-gray-500 mb-1">Additional Notes</label>
                <textarea {...assessForm.register('additional_notes')} rows={2} className={inputCls} /></div>
              <div className="flex justify-end">
                <button type="submit" className="px-5 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Save Assessment</button>
              </div>
            </form>
          </div>

          <div className="space-y-2">
            {assessments?.map((a: any) => (
              <div key={a.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-800 capitalize">{a.assessment_type?.replace(/_/g,' ')} Assessment</p>
                    <p className="text-xs text-gray-400">{format(new Date(a.assessment_date), 'dd MMM yyyy, HH:mm')}</p>
                  </div>
                  <div className="flex gap-2">
                    {a.general_condition && <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${a.general_condition === 'good' ? 'bg-green-100 text-green-700' : a.general_condition === 'critical' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{a.general_condition}</span>}
                    {a.fall_risk_level && <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${a.fall_risk_level === 'high' ? 'bg-red-100 text-red-700' : a.fall_risk_level === 'moderate' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>Fall: {a.fall_risk_level}</span>}
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3 text-xs">
                  {a.pain_score !== null && a.pain_score !== undefined && <div><span className="text-gray-400">Pain:</span> <span className="font-medium">{a.pain_score}/10</span></div>}
                  {a.consciousness && <div><span className="text-gray-400">Consciousness:</span> <span className="font-medium capitalize">{a.consciousness}</span></div>}
                  {a.braden_score && <div><span className="text-gray-400">Braden:</span> <span className="font-medium">{a.braden_score}</span></div>}
                  {a.nutritional_status && <div><span className="text-gray-400">Nutrition:</span> <span className="font-medium capitalize">{a.nutritional_status?.replace(/_/g,' ')}</span></div>}
                </div>
              </div>
            ))}
            {!assessments?.length && <p className="text-center text-gray-400 py-8">No assessments. Enter Admission ID above.</p>}
          </div>
        </div>
      )}

      {/* CARE PLANS */}
      {tab === 3 && (
        <div className="space-y-4">
          {selectedPlanId && (
            <div className="bg-white rounded-xl border border-blue-200 p-4 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-semibold text-gray-700">Record Intervention for Plan #{selectedPlanId}</h3>
                <button onClick={() => setSelectedPlanId(null)} className="text-xs text-gray-400">Close ✕</button>
              </div>
              <form onSubmit={interventionForm.handleSubmit(d => addIntervention.mutate(d))} className="space-y-3">
                <div><label className="block text-xs text-gray-500 mb-1">Intervention Done *</label>
                  <textarea {...interventionForm.register('intervention', { required: true })} rows={2} className={inputCls} placeholder="What was done..." /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs text-gray-500 mb-1">Outcome</label>
                    <input {...interventionForm.register('outcome')} className={inputCls} /></div>
                  <div><label className="block text-xs text-gray-500 mb-1">Patient Response</label>
                    <input {...interventionForm.register('patient_response')} className={inputCls} /></div>
                </div>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Save Intervention</button>
              </form>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Create Care Plan</h2>
            <form onSubmit={planForm.handleSubmit(d => createPlan.mutate(d))} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-gray-500 mb-1">Patient ID *</label>
                  <input {...planForm.register('patient_id', { required: true })} type="number" className={inputCls} /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Priority</label>
                  <select {...planForm.register('priority')} className={`${inputCls} bg-white`}>
                    <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
                  </select></div>
              </div>
              <div><label className="block text-xs text-gray-500 mb-1">Problem Statement *</label>
                <input {...planForm.register('problem_statement', { required: true })} className={inputCls} placeholder="e.g. Risk for infection related to IV catheter" /></div>
              <div><label className="block text-xs text-gray-500 mb-1">Nursing Diagnosis</label>
                <input {...planForm.register('nursing_diagnosis')} className={inputCls} /></div>
              <div><label className="block text-xs text-gray-500 mb-1">Goal *</label>
                <input {...planForm.register('goal', { required: true })} className={inputCls} placeholder="Patient will remain infection-free during hospitalization" /></div>
              <div><label className="block text-xs text-gray-500 mb-1">Interventions (one per line)</label>
                <textarea {...planForm.register('interventions')} rows={3} className={inputCls} placeholder="Change IV site every 72 hours&#10;Monitor for signs of infection&#10;Maintain aseptic technique" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-gray-500 mb-1">Expected Outcome</label>
                  <input {...planForm.register('expected_outcome')} className={inputCls} /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Target Date</label>
                  <input {...planForm.register('target_date')} type="date" className={inputCls} /></div>
              </div>
              <div className="flex justify-end">
                <button type="submit" className="px-5 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Create Plan</button>
              </div>
            </form>
          </div>

          <div className="space-y-3">
            {carePlans?.map((plan: any) => (
              <div key={plan.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">{plan.problem_statement}</p>
                    {plan.nursing_diagnosis && <p className="text-xs text-gray-400 mt-0.5">{plan.nursing_diagnosis}</p>}
                  </div>
                  <div className="flex gap-2 ml-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${plan.priority === 'high' ? 'bg-red-100 text-red-700' : plan.priority === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>{plan.priority}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${plan.status === 'active' ? 'bg-green-100 text-green-700' : plan.status === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>{plan.status}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-600"><span className="font-medium">Goal:</span> {plan.goal}</p>
                {plan.interventions?.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-medium text-gray-500 mb-1">Interventions:</p>
                    <ul className="space-y-0.5">
                      {plan.interventions.map((i: string, idx: number) => (
                        <li key={idx} className="text-xs text-gray-600 flex items-start gap-1.5">
                          <span className="text-blue-400 flex-shrink-0 mt-0.5">•</span>{i}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {plan.status === 'active' && (
                  <button onClick={() => setSelectedPlanId(plan.id)}
                    className="mt-3 text-xs text-blue-600 hover:underline flex items-center gap-1">
                    <Plus size={12} /> Record Intervention
                  </button>
                )}
              </div>
            ))}
            {!carePlans?.length && <p className="text-center text-gray-400 py-6">No care plans. Enter Admission ID above.</p>}
          </div>
        </div>
      )}

      {/* HANDOVER */}
      {tab === 4 && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Create Shift Handover</h2>
            <form onSubmit={handoverForm.handleSubmit(d => createHandover.mutate(d))} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-gray-500 mb-1">Date *</label>
                  <input {...handoverForm.register('shift_date', { required: true })} type="date" defaultValue={format(new Date(), 'yyyy-MM-dd')} className={inputCls} /></div>
                <div><label className="block text-xs text-gray-500 mb-1">From Shift *</label>
                  <select {...handoverForm.register('from_shift', { required: true })} className={`${inputCls} bg-white`}>
                    <option value="morning">Morning</option>
                    <option value="afternoon">Afternoon</option>
                    <option value="night">Night</option>
                  </select></div>
                <div><label className="block text-xs text-gray-500 mb-1">To Shift *</label>
                  <select {...handoverForm.register('to_shift', { required: true })} className={`${inputCls} bg-white`}>
                    <option value="afternoon">Afternoon</option>
                    <option value="night">Night</option>
                    <option value="morning">Morning</option>
                  </select></div>
                <div><label className="block text-xs text-gray-500 mb-1">Total Patients</label>
                  <input {...handoverForm.register('total_patients')} type="number" className={inputCls} /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Critical Patients</label>
                  <input {...handoverForm.register('critical_patients')} type="number" defaultValue="0" className={inputCls} /></div>
                <div><label className="block text-xs text-gray-500 mb-1">New Admissions</label>
                  <input {...handoverForm.register('new_admissions')} type="number" defaultValue="0" className={inputCls} /></div>
              </div>
              <div><label className="block text-xs text-gray-500 mb-1">General Notes</label>
                <textarea {...handoverForm.register('general_notes')} rows={3} className={inputCls} placeholder="Ward status, special observations..." /></div>
              <div><label className="block text-xs text-gray-500 mb-1">Pending Tasks (one per line)</label>
                <textarea {...handoverForm.register('pending_tasks')} rows={3} className={inputCls} placeholder="Change IV line for Bed 3&#10;Send urine sample to lab&#10;Doctor review for Bed 7" /></div>
              <div><label className="block text-xs text-gray-500 mb-1">Critical Alerts (one per line)</label>
                <textarea {...handoverForm.register('critical_alerts')} rows={2} className={inputCls} placeholder="Patient in Bed 5 - NPO status&#10;Allergic to Penicillin - Bed 8" /></div>
              <button type="submit" className="w-full py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Submit Handover</button>
            </form>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Today's Handovers</h2>
            <div className="space-y-3">
              {handovers?.map((h: any) => (
                <div key={h.id} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full capitalize">{h.from_shift}</span>
                      <span className="text-gray-300">→</span>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full capitalize">{h.to_shift}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${h.received_by ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {h.received_by ? 'Received' : 'Pending'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-center mb-2">
                    <div className="bg-gray-50 rounded p-1.5"><p className="font-bold text-gray-700">{h.total_patients}</p><p className="text-gray-400">Total</p></div>
                    <div className="bg-red-50 rounded p-1.5"><p className="font-bold text-red-600">{h.critical_patients}</p><p className="text-gray-400">Critical</p></div>
                    <div className="bg-blue-50 rounded p-1.5"><p className="font-bold text-blue-600">{h.new_admissions}</p><p className="text-gray-400">New</p></div>
                  </div>
                  {h.general_notes && <p className="text-xs text-gray-600 mb-2">{h.general_notes}</p>}
                  {h.critical_alerts?.length > 0 && (
                    <div className="bg-red-50 rounded-lg p-2">
                      <p className="text-xs font-semibold text-red-700 mb-1 flex items-center gap-1"><AlertTriangle size={11} /> Critical Alerts</p>
                      {h.critical_alerts.map((a: string, i: number) => <p key={i} className="text-xs text-red-600">• {a}</p>)}
                    </div>
                  )}
                  {!h.received_by && (
                    <button onClick={() => nursingService.receiveHandover(h.id).then(() => { qc.invalidateQueries({ queryKey: ['handovers'] }); toast.success('Handover received') })}
                      className="mt-2 w-full py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700">
                      Acknowledge Handover
                    </button>
                  )}
                </div>
              ))}
              {!handovers?.length && <p className="text-center text-gray-400 py-8">No handovers today</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

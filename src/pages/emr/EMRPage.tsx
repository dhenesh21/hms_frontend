import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { emrService } from '../../services/api'
import { AlertTriangle, Heart, Pill, Users, Scissors, Shield, FileText, Activity, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const TABS = ['Allergies', 'Conditions', 'Medications', 'Family Hx', 'Surgical Hx', 'Immunizations', 'Documents', 'Diagnoses']
const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"

const SEVERITY_COLORS: Record<string, string> = {
  mild: 'bg-yellow-100 text-yellow-700',
  moderate: 'bg-orange-100 text-orange-700',
  severe: 'bg-red-100 text-red-700',
  life_threatening: 'bg-red-900 text-white',
}

export default function EMRPage() {
  const { patientId } = useParams()
  const qc = useQueryClient()
  const [tab, setTab] = useState(0)
  const { register, handleSubmit, reset } = useForm()

  const { data: emr, isLoading } = useQuery({
    queryKey: ['emr', patientId],
    queryFn: () => emrService.getFullEMR(Number(patientId)).then(r => r.data)
  })

  const mutations: Record<string, any> = {
    allergy: useMutation({
      mutationFn: (d: any) => emrService.addAllergy({ ...d, patient_id: Number(patientId) }),
      onSuccess: () => { qc.invalidateQueries({ queryKey: ['emr'] }); reset(); toast.success('Allergy added') }
    }),
    condition: useMutation({
      mutationFn: (d: any) => emrService.addCondition({ ...d, patient_id: Number(patientId) }),
      onSuccess: () => { qc.invalidateQueries({ queryKey: ['emr'] }); reset(); toast.success('Condition added') }
    }),
    medication: useMutation({
      mutationFn: (d: any) => emrService.addMedication({ ...d, patient_id: Number(patientId) }),
      onSuccess: () => { qc.invalidateQueries({ queryKey: ['emr'] }); reset(); toast.success('Medication added') }
    }),
    family: useMutation({
      mutationFn: (d: any) => emrService.addFamilyHistory({ ...d, patient_id: Number(patientId) }),
      onSuccess: () => { qc.invalidateQueries({ queryKey: ['emr'] }); reset(); toast.success('Family history added') }
    }),
    surgical: useMutation({
      mutationFn: (d: any) => emrService.addSurgicalHistory({ ...d, patient_id: Number(patientId) }),
      onSuccess: () => { qc.invalidateQueries({ queryKey: ['emr'] }); reset(); toast.success('Surgical history added') }
    }),
    immunization: useMutation({
      mutationFn: (d: any) => emrService.addImmunization({ ...d, patient_id: Number(patientId) }),
      onSuccess: () => { qc.invalidateQueries({ queryKey: ['emr'] }); reset(); toast.success('Immunization added') }
    }),
    document: useMutation({
      mutationFn: (d: any) => emrService.addDocument({ ...d, patient_id: Number(patientId) }),
      onSuccess: () => { qc.invalidateQueries({ queryKey: ['emr'] }); reset(); toast.success('Document added') }
    }),
    diagnosis: useMutation({
      mutationFn: (d: any) => emrService.addDiagnosis({ ...d, patient_id: Number(patientId) }),
      onSuccess: () => { qc.invalidateQueries({ queryKey: ['emr'] }); reset(); toast.success('Diagnosis added') }
    }),
  }

  if (isLoading) return <div className="text-center py-20 text-gray-400">Loading EMR...</div>

  const TAB_ICONS = [AlertTriangle, Heart, Pill, Users, Scissors, Shield, FileText, Activity]

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Electronic Medical Record</h1>
        <p className="text-sm text-gray-500">Patient ID: {patientId}</p>
      </div>

      {/* Critical Allergies Banner */}
      {emr?.allergies?.filter((a: any) => a.severity === 'life_threatening').length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={18} />
          <div>
            <p className="text-sm font-semibold text-red-800">⚠️ Critical Allergies</p>
            <p className="text-sm text-red-700">
              {emr.allergies.filter((a: any) => a.severity === 'life_threatening').map((a: any) => a.allergen).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Tab bar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {TABS.map((t, i) => {
            const Icon = TAB_ICONS[i]
            return (
              <button key={t} onClick={() => setTab(i)}
                className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium whitespace-nowrap transition border-b-2
                  ${tab === i ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                <Icon size={13} />{t}
              </button>
            )
          })}
        </div>

        <div className="p-5">
          {/* ALLERGIES */}
          {tab === 0 && (
            <div className="space-y-4">
              <form onSubmit={handleSubmit(d => mutations.allergy.mutate(d))} className="grid grid-cols-4 gap-3 bg-gray-50 p-4 rounded-lg">
                <div><label className="block text-xs text-gray-500 mb-1">Allergen *</label>
                  <input {...register('allergen', { required: true })} className={inputCls} placeholder="Drug/Food name" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Type</label>
                  <select {...register('allergy_type')} className={`${inputCls} bg-white`}>
                    {['drug', 'food', 'environment', 'other'].map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
                  </select></div>
                <div><label className="block text-xs text-gray-500 mb-1">Severity</label>
                  <select {...register('severity')} className={`${inputCls} bg-white`}>
                    {['mild', 'moderate', 'severe', 'life_threatening'].map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select></div>
                <div><label className="block text-xs text-gray-500 mb-1">Reaction</label>
                  <input {...register('reaction')} className={inputCls} placeholder="e.g. Rash, Anaphylaxis" /></div>
                <div className="col-span-4 flex justify-end">
                  <button type="submit" className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 flex items-center gap-1">
                    <Plus size={14} /> Add Allergy
                  </button>
                </div>
              </form>
              <div className="space-y-2">
                {emr?.allergies?.map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{a.allergen}</p>
                      <p className="text-xs text-gray-400 capitalize">{a.allergy_type} • {a.reaction}</p>
                    </div>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${SEVERITY_COLORS[a.severity]}`}>
                      {a.severity.replace('_', ' ')}
                    </span>
                  </div>
                ))}
                {!emr?.allergies?.length && <p className="text-center text-gray-400 py-6">No allergies recorded</p>}
              </div>
            </div>
          )}

          {/* CHRONIC CONDITIONS */}
          {tab === 1 && (
            <div className="space-y-4">
              <form onSubmit={handleSubmit(d => mutations.condition.mutate(d))} className="grid grid-cols-3 gap-3 bg-gray-50 p-4 rounded-lg">
                <div><label className="block text-xs text-gray-500 mb-1">Condition *</label>
                  <input {...register('condition_name', { required: true })} className={inputCls} placeholder="e.g. Type 2 Diabetes" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">ICD Code</label>
                  <input {...register('icd_code')} className={inputCls} placeholder="E11.9" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Status</label>
                  <select {...register('current_status')} className={`${inputCls} bg-white`}>
                    {['active', 'controlled', 'resolved'].map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                  </select></div>
                <div className="col-span-3 flex justify-end">
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center gap-1">
                    <Plus size={14} /> Add Condition
                  </button>
                </div>
              </form>
              <div className="space-y-2">
                {emr?.chronic_conditions?.map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{c.condition_name}</p>
                      {c.icd_code && <p className="text-xs text-gray-400 font-mono">{c.icd_code}</p>}
                    </div>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium
                      ${c.current_status === 'active' ? 'bg-red-100 text-red-700' :
                        c.current_status === 'controlled' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                      {c.current_status}
                    </span>
                  </div>
                ))}
                {!emr?.chronic_conditions?.length && <p className="text-center text-gray-400 py-6">No conditions recorded</p>}
              </div>
            </div>
          )}

          {/* MEDICATIONS */}
          {tab === 2 && (
            <div className="space-y-4">
              <form onSubmit={handleSubmit(d => mutations.medication.mutate(d))} className="grid grid-cols-3 gap-3 bg-gray-50 p-4 rounded-lg">
                <div><label className="block text-xs text-gray-500 mb-1">Drug Name *</label>
                  <input {...register('drug_name', { required: true })} className={inputCls} placeholder="Metformin" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Dosage</label>
                  <input {...register('dosage')} className={inputCls} placeholder="500mg" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Frequency</label>
                  <input {...register('frequency')} className={inputCls} placeholder="Twice daily" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Start Date</label>
                  <input {...register('start_date')} type="date" className={inputCls} /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Prescribed By</label>
                  <input {...register('prescribed_by')} className={inputCls} placeholder="Dr. Name" /></div>
                <div className="flex items-end">
                  <button type="submit" className="w-full px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center justify-center gap-1">
                    <Plus size={14} /> Add
                  </button>
                </div>
              </form>
              <div className="space-y-2">
                {emr?.medication_history?.map((m: any) => (
                  <div key={m.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{m.drug_name} <span className="text-gray-400 font-normal">{m.dosage}</span></p>
                      <p className="text-xs text-gray-400">{m.frequency}</p>
                    </div>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${m.is_current ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {m.is_current ? 'Current' : 'Past'}
                    </span>
                  </div>
                ))}
                {!emr?.medication_history?.length && <p className="text-center text-gray-400 py-6">No medication history</p>}
              </div>
            </div>
          )}

          {/* FAMILY HISTORY */}
          {tab === 3 && (
            <div className="space-y-4">
              <form onSubmit={handleSubmit(d => mutations.family.mutate(d))} className="grid grid-cols-3 gap-3 bg-gray-50 p-4 rounded-lg">
                <div><label className="block text-xs text-gray-500 mb-1">Relation *</label>
                  <select {...register('relation', { required: true })} className={`${inputCls} bg-white`}>
                    {['Father', 'Mother', 'Sibling', 'Grandparent', 'Uncle', 'Aunt', 'Other'].map(r => <option key={r}>{r}</option>)}
                  </select></div>
                <div><label className="block text-xs text-gray-500 mb-1">Condition *</label>
                  <input {...register('condition', { required: true })} className={inputCls} placeholder="Diabetes, Heart disease..." /></div>
                <div className="flex items-end">
                  <button type="submit" className="w-full px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                    Add
                  </button>
                </div>
              </form>
              <div className="divide-y divide-gray-50">
                {emr?.family_history?.map((f: any) => (
                  <div key={f.id} className="flex items-center justify-between py-3">
                    <p className="text-sm text-gray-800"><span className="font-medium">{f.relation}:</span> {f.condition}</p>
                  </div>
                ))}
                {!emr?.family_history?.length && <p className="text-center text-gray-400 py-6">No family history</p>}
              </div>
            </div>
          )}

          {/* SURGICAL HISTORY */}
          {tab === 4 && (
            <div className="space-y-4">
              <form onSubmit={handleSubmit(d => mutations.surgical.mutate(d))} className="grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-lg">
                <div><label className="block text-xs text-gray-500 mb-1">Procedure *</label>
                  <input {...register('procedure_name', { required: true })} className={inputCls} placeholder="Appendectomy" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Date</label>
                  <input {...register('surgery_date')} type="date" className={inputCls} /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Surgeon</label>
                  <input {...register('surgeon')} className={inputCls} placeholder="Dr. Name" /></div>
                <div className="flex items-end">
                  <button type="submit" className="w-full px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Add</button>
                </div>
              </form>
              <div className="space-y-2">
                {emr?.surgical_history?.map((s: any) => (
                  <div key={s.id} className="p-3 border border-gray-100 rounded-lg">
                    <p className="text-sm font-medium text-gray-900">{s.procedure_name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {s.surgery_date ? format(new Date(s.surgery_date), 'dd MMM yyyy') : '—'}
                      {s.surgeon ? ` • ${s.surgeon}` : ''}
                    </p>
                    {s.complications && <p className="text-xs text-red-500 mt-0.5">⚠ {s.complications}</p>}
                  </div>
                ))}
                {!emr?.surgical_history?.length && <p className="text-center text-gray-400 py-6">No surgical history</p>}
              </div>
            </div>
          )}

          {/* IMMUNIZATIONS */}
          {tab === 5 && (
            <div className="space-y-4">
              <form onSubmit={handleSubmit(d => mutations.immunization.mutate(d))} className="grid grid-cols-3 gap-3 bg-gray-50 p-4 rounded-lg">
                <div><label className="block text-xs text-gray-500 mb-1">Vaccine *</label>
                  <input {...register('vaccine_name', { required: true })} className={inputCls} placeholder="COVID-19, Hepatitis B..." /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Date *</label>
                  <input {...register('administered_date', { required: true })} type="date" className={inputCls} /></div>
                <div className="flex items-end">
                  <button type="submit" className="w-full px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Add</button>
                </div>
              </form>
              <div className="divide-y divide-gray-50">
                {emr?.immunizations?.map((im: any) => (
                  <div key={im.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{im.vaccine_name} <span className="text-gray-400 text-xs">Dose {im.dose_number}</span></p>
                      <p className="text-xs text-gray-400">{format(new Date(im.administered_date), 'dd MMM yyyy')}</p>
                    </div>
                    {im.next_due_date && (
                      <p className="text-xs text-amber-600">Next: {format(new Date(im.next_due_date), 'dd MMM yyyy')}</p>
                    )}
                  </div>
                ))}
                {!emr?.immunizations?.length && <p className="text-center text-gray-400 py-6">No immunization records</p>}
              </div>
            </div>
          )}

          {/* DOCUMENTS */}
          {tab === 6 && (
            <div className="space-y-4">
              <form onSubmit={handleSubmit(d => mutations.document.mutate(d))} className="grid grid-cols-3 gap-3 bg-gray-50 p-4 rounded-lg">
                <div><label className="block text-xs text-gray-500 mb-1">Title *</label>
                  <input {...register('title', { required: true })} className={inputCls} placeholder="CBC Report" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Type</label>
                  <select {...register('document_type')} className={`${inputCls} bg-white`}>
                    {['lab_report', 'scan_report', 'discharge_summary', 'prescription', 'other'].map(t => (
                      <option key={t} value={t}>{t.replace('_', ' ')}</option>
                    ))}
                  </select></div>
                <div><label className="block text-xs text-gray-500 mb-1">Source</label>
                  <input {...register('source')} className={inputCls} placeholder="Lab name / Hospital" /></div>
                <div className="col-span-3 flex justify-end">
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center gap-1">
                    <Plus size={14} /> Add Document
                  </button>
                </div>
              </form>
              <div className="space-y-2">
                {emr?.documents?.map((d: any) => (
                  <div key={d.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText size={16} className="text-blue-400 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{d.title}</p>
                        <p className="text-xs text-gray-400">{d.source} • {d.document_type.replace('_', ' ')}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400">{d.document_date ? format(new Date(d.document_date), 'dd MMM yyyy') : format(new Date(d.created_at), 'dd MMM yyyy')}</p>
                  </div>
                ))}
                {!emr?.documents?.length && <p className="text-center text-gray-400 py-6">No documents</p>}
              </div>
            </div>
          )}

          {/* DIAGNOSES */}
          {tab === 7 && (
            <div className="space-y-4">
              <form onSubmit={handleSubmit(d => mutations.diagnosis.mutate(d))} className="grid grid-cols-3 gap-3 bg-gray-50 p-4 rounded-lg">
                <div className="col-span-2"><label className="block text-xs text-gray-500 mb-1">Diagnosis *</label>
                  <input {...register('diagnosis', { required: true })} className={inputCls} placeholder="Type 2 Diabetes Mellitus" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">ICD Code</label>
                  <input {...register('icd_code')} className={inputCls} placeholder="E11.9" /></div>
                <div className="col-span-3 flex justify-end">
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center gap-1">
                    <Plus size={14} /> Add Diagnosis
                  </button>
                </div>
              </form>
              <div className="divide-y divide-gray-50">
                {emr?.diagnosis_records?.map((d: any) => (
                  <div key={d.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{d.diagnosis}</p>
                      <p className="text-xs text-gray-400">
                        {d.icd_code && <span className="font-mono mr-2">{d.icd_code}</span>}
                        {d.diagnosis_date ? format(new Date(d.diagnosis_date), 'dd MMM yyyy') : ''}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${d.diagnosis_type === 'primary' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                      {d.diagnosis_type}
                    </span>
                  </div>
                ))}
                {!emr?.diagnosis_records?.length && <p className="text-center text-gray-400 py-6">No diagnoses</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

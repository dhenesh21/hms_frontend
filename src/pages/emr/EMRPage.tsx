import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { emrService } from '../../services/api'
import { AlertTriangle, Heart, Pill, Users, Scissors, Shield, FileText, Activity, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { cleanPayload } from '../../utils/form'

const TABS = ['Allergies', 'Conditions', 'Medications', 'Family Hx', 'Surgical Hx', 'Immunizations', 'Documents', 'Diagnoses']
const inputCls = "input"

const SEVERITY_COLORS: Record<string, string> = {
  mild: 'bg-yellow-100 text-yellow-700',
  moderate: 'bg-orange-100 text-orange-700',
  severe: 'badge-red',
  life_threatening: 'bg-red-900 text-white',
}

export default function EMRPage() {
  const { patientId } = useParams()
  if (!patientId || isNaN(Number(patientId))) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: '#A78BFA' }}>
        <p style={{ fontSize: 16, fontWeight: 600 }}>Select a patient to view EMR</p>
        <p style={{ fontSize: 13, marginTop: 8 }}>Go to Patients → click patient → View EMR</p>
      </div>
    )
  }
  const qc = useQueryClient()
  const [tab, setTab] = useState(0)

  // Each tab gets its own form instance so a required field left empty on
  // one tab (e.g. Allergen on the Allergies tab) doesn't silently block
  // handleSubmit on a different tab, and reset() only clears that tab.
  const allergyForm = useForm()
  const conditionForm = useForm()
  const medicationForm = useForm()
  const familyForm = useForm()
  const surgicalForm = useForm()
  const immunizationForm = useForm()
  const documentForm = useForm()
  const diagnosisForm = useForm()

  const { data: emr, isLoading } = useQuery({
    queryKey: ['emr', patientId],
    queryFn: () => emrService.getFullEMR(Number(patientId)).then(r => r.data)
  })

  const mutations: Record<string, any> = {
    allergy: useMutation({
      mutationFn: (d: any) => emrService.addAllergy(cleanPayload({ ...d, patient_id: Number(patientId) })),
      onSuccess: () => { qc.invalidateQueries({ queryKey: ['emr'] }); allergyForm.reset(); toast.success('Allergy added') },
      onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to add allergy')
    }),
    condition: useMutation({
      mutationFn: (d: any) => emrService.addCondition(cleanPayload({ ...d, patient_id: Number(patientId) })),
      onSuccess: () => { qc.invalidateQueries({ queryKey: ['emr'] }); conditionForm.reset(); toast.success('Condition added') },
      onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to add condition')
    }),
    medication: useMutation({
      mutationFn: (d: any) => emrService.addMedication(cleanPayload({ ...d, patient_id: Number(patientId) })),
      onSuccess: () => { qc.invalidateQueries({ queryKey: ['emr'] }); medicationForm.reset(); toast.success('Medication added') },
      onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to add medication')
    }),
    family: useMutation({
      mutationFn: (d: any) => emrService.addFamilyHistory(cleanPayload({ ...d, patient_id: Number(patientId) })),
      onSuccess: () => { qc.invalidateQueries({ queryKey: ['emr'] }); familyForm.reset(); toast.success('Family history added') },
      onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to add family history')
    }),
    surgical: useMutation({
      mutationFn: (d: any) => emrService.addSurgicalHistory(cleanPayload({ ...d, patient_id: Number(patientId) })),
      onSuccess: () => { qc.invalidateQueries({ queryKey: ['emr'] }); surgicalForm.reset(); toast.success('Surgical history added') },
      onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to add surgical history')
    }),
    immunization: useMutation({
      mutationFn: (d: any) => emrService.addImmunization(cleanPayload({ ...d, patient_id: Number(patientId) })),
      onSuccess: () => { qc.invalidateQueries({ queryKey: ['emr'] }); immunizationForm.reset(); toast.success('Immunization added') },
      onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to add immunization')
    }),
    document: useMutation({
      mutationFn: (d: any) => emrService.addDocument(cleanPayload({ ...d, patient_id: Number(patientId) })),
      onSuccess: () => { qc.invalidateQueries({ queryKey: ['emr'] }); documentForm.reset(); toast.success('Document added') },
      onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to add document')
    }),
    diagnosis: useMutation({
      mutationFn: (d: any) => emrService.addDiagnosis(cleanPayload({ ...d, patient_id: Number(patientId) })),
      onSuccess: () => { qc.invalidateQueries({ queryKey: ['emr'] }); diagnosisForm.reset(); toast.success('Diagnosis added') },
      onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to add diagnosis')
    }),
  }

  if (isLoading) return <div className="text-center py-20 text-gray-400">Loading EMR...</div>

  const TAB_ICONS = [AlertTriangle, Heart, Pill, Users, Scissors, Shield, FileText, Activity]

  return (
    <div style={{ width: "100%" }}>
      <div>
        <h1 className="page-title">Electronic Medical Record</h1>
        <p className="page-subtitle">Patient ID: {patientId}</p>
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
      <div className="table-wrapper">
        <div className="flex border-b border-purple-50 overflow-x-auto">
          {TABS.map((t, i) => {
            const Icon = TAB_ICONS[i]
            return (
              <button key={t} onClick={() => setTab(i)}
                className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium whitespace-nowrap transition border-b-2
                  ${tab === i ? 'border-violet-600 text-violet-700' : 'border-transparent tab'}`}>
                <Icon size={13} />{t}
              </button>
            )
          })}
        </div>

        <div className="p-5">
          {/* ALLERGIES */}
          {tab === 0 && (
            <div className="space-y-4">
              <form onSubmit={allergyForm.handleSubmit(d => mutations.allergy.mutate(d))} className="grid grid-cols-4 gap-3 bg-gray-50 p-4 rounded-lg">
                <div><label className="block text-xs text-gray-500 mb-1">Allergen *</label>
                  <input {...allergyForm.register('allergen', { required: true })} className={inputCls} placeholder="Drug/Food name" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Type</label>
                  <select {...allergyForm.register('allergy_type')} className={`${inputCls} bg-white`}>
                    {['drug', 'food', 'environment', 'other'].map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
                  </select></div>
                <div><label className="block text-xs text-gray-500 mb-1">Severity</label>
                  <select {...allergyForm.register('severity')} className={`${inputCls} bg-white`}>
                    {['mild', 'moderate', 'severe', 'life_threatening'].map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select></div>
                <div><label className="block text-xs text-gray-500 mb-1">Reaction</label>
                  <input {...allergyForm.register('reaction')} className={inputCls} placeholder="e.g. Rash, Anaphylaxis" /></div>
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
                    <span className={`badge ${SEVERITY_COLORS[a.severity]}`}>
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
              <form onSubmit={conditionForm.handleSubmit(d => mutations.condition.mutate(d))} className="grid grid-cols-3 gap-3 bg-gray-50 p-4 rounded-lg">
                <div><label className="block text-xs text-gray-500 mb-1">Condition *</label>
                  <input {...conditionForm.register('condition_name', { required: true })} className={inputCls} placeholder="e.g. Type 2 Diabetes" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">ICD Code</label>
                  <input {...conditionForm.register('icd_code')} className={inputCls} placeholder="E11.9" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Status</label>
                  <select {...conditionForm.register('current_status')} className={`${inputCls} bg-white`}>
                    {['active', 'controlled', 'resolved'].map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                  </select></div>
                <div className="col-span-3 flex justify-end">
                  <button type="submit" className="btn-primary flex items-center gap-1">
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
                    <span className={`badge
                      ${c.current_status === 'active' ? 'badge-red' :
                        c.current_status === 'controlled' ? 'badge-amber' : 'badge-green'}`}>
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
              <form onSubmit={medicationForm.handleSubmit(d => mutations.medication.mutate(d))} className="grid grid-cols-3 gap-3 bg-gray-50 p-4 rounded-lg">
                <div><label className="block text-xs text-gray-500 mb-1">Drug Name *</label>
                  <input {...medicationForm.register('drug_name', { required: true })} className={inputCls} placeholder="Metformin" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Dosage</label>
                  <input {...medicationForm.register('dosage')} className={inputCls} placeholder="500mg" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Frequency</label>
                  <input {...medicationForm.register('frequency')} className={inputCls} placeholder="Twice daily" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Start Date</label>
                  <input {...medicationForm.register('start_date')} type="date" className={inputCls} /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Prescribed By</label>
                  <input {...medicationForm.register('prescribed_by')} className={inputCls} placeholder="Dr. Name" /></div>
                <div className="flex items-end">
                  <button type="submit" className="w-full btn-primary flex items-center justify-center gap-1">
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
                    <span className={`badge ${m.is_current ? 'badge-green' : 'badge-gray'}`}>
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
              <form onSubmit={familyForm.handleSubmit(d => mutations.family.mutate(d))} className="grid grid-cols-3 gap-3 bg-gray-50 p-4 rounded-lg">
                <div><label className="block text-xs text-gray-500 mb-1">Relation *</label>
                  <select {...familyForm.register('relation', { required: true })} className={`${inputCls} bg-white`}>
                    {['Father', 'Mother', 'Sibling', 'Grandparent', 'Uncle', 'Aunt', 'Other'].map(r => <option key={r}>{r}</option>)}
                  </select></div>
                <div><label className="block text-xs text-gray-500 mb-1">Condition *</label>
                  <input {...familyForm.register('condition', { required: true })} className={inputCls} placeholder="Diabetes, Heart disease..." /></div>
                <div className="flex items-end">
                  <button type="submit" className="w-full btn-primary">
                    Add
                  </button>
                </div>
              </form>
              <div className="divide-y divide-purple-50">
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
              <form onSubmit={surgicalForm.handleSubmit(d => mutations.surgical.mutate(d))} className="grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-lg">
                <div><label className="block text-xs text-gray-500 mb-1">Procedure *</label>
                  <input {...surgicalForm.register('procedure_name', { required: true })} className={inputCls} placeholder="Appendectomy" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Date</label>
                  <input {...surgicalForm.register('surgery_date')} type="date" className={inputCls} /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Surgeon</label>
                  <input {...surgicalForm.register('surgeon')} className={inputCls} placeholder="Dr. Name" /></div>
                <div className="flex items-end">
                  <button type="submit" className="w-full btn-primary">Add</button>
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
              <form onSubmit={immunizationForm.handleSubmit(d => mutations.immunization.mutate(d))} className="grid grid-cols-3 gap-3 bg-gray-50 p-4 rounded-lg">
                <div><label className="block text-xs text-gray-500 mb-1">Vaccine *</label>
                  <input {...immunizationForm.register('vaccine_name', { required: true })} className={inputCls} placeholder="COVID-19, Hepatitis B..." /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Date *</label>
                  <input {...immunizationForm.register('administered_date', { required: true })} type="date" className={inputCls} /></div>
                <div className="flex items-end">
                  <button type="submit" className="w-full btn-primary">Add</button>
                </div>
              </form>
              <div className="divide-y divide-purple-50">
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
              <form onSubmit={documentForm.handleSubmit(d => mutations.document.mutate(d))} className="grid grid-cols-3 gap-3 bg-gray-50 p-4 rounded-lg">
                <div><label className="block text-xs text-gray-500 mb-1">Title *</label>
                  <input {...documentForm.register('title', { required: true })} className={inputCls} placeholder="CBC Report" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Type</label>
                  <select {...documentForm.register('document_type')} className={`${inputCls} bg-white`}>
                    {['lab_report', 'scan_report', 'discharge_summary', 'prescription', 'other'].map(t => (
                      <option key={t} value={t}>{t.replace('_', ' ')}</option>
                    ))}
                  </select></div>
                <div><label className="block text-xs text-gray-500 mb-1">Source</label>
                  <input {...documentForm.register('source')} className={inputCls} placeholder="Lab name / Hospital" /></div>
                <div className="col-span-3 flex justify-end">
                  <button type="submit" className="btn-primary flex items-center gap-1">
                    <Plus size={14} /> Add Document
                  </button>
                </div>
              </form>
              <div className="space-y-2">
                {emr?.documents?.map((d: any) => (
                  <div key={d.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText size={16} className="text-violet-400 flex-shrink-0" />
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
              <form onSubmit={diagnosisForm.handleSubmit(d => mutations.diagnosis.mutate(d))} className="grid grid-cols-3 gap-3 bg-gray-50 p-4 rounded-lg">
                <div className="col-span-2"><label className="block text-xs text-gray-500 mb-1">Diagnosis *</label>
                  <input {...diagnosisForm.register('diagnosis', { required: true })} className={inputCls} placeholder="Type 2 Diabetes Mellitus" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">ICD Code</label>
                  <input {...diagnosisForm.register('icd_code')} className={inputCls} placeholder="E11.9" /></div>
                <div className="col-span-3 flex justify-end">
                  <button type="submit" className="btn-primary flex items-center gap-1">
                    <Plus size={14} /> Add Diagnosis
                  </button>
                </div>
              </form>
              <div className="divide-y divide-purple-50">
                {emr?.diagnosis_records?.map((d: any) => (
                  <div key={d.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{d.diagnosis}</p>
                      <p className="text-xs text-gray-400">
                        {d.icd_code && <span className="font-mono mr-2">{d.icd_code}</span>}
                        {d.diagnosis_date ? format(new Date(d.diagnosis_date), 'dd MMM yyyy') : ''}
                      </p>
                    </div>
                    <span className={`badge ${d.diagnosis_type === 'primary' ? 'badge-blue' : 'badge-gray'}`}>
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

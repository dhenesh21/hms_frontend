import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { ipdService, patientService } from '../../services/api'
import { DoctorSearchInput } from '../../components/ui/DoctorSearchInput'
import { ArrowLeft, BedDouble, Save, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { cleanPayload } from '../../utils/form'
import CustomSelect from '../../components/ui/CustomSelect'

export default function IPDAdmitPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [selectedWard, setSelectedWard] = useState<number | null>(null)
  const [selectedPatient, setSelectedPatient] = useState<any>(null)
  const [patientSearch, setPatientSearch] = useState('')
  const [showPatientList, setShowPatientList] = useState(false)

  const { register, setValue, watch, handleSubmit } = useForm()
  const inputCls = "input"
  // Wards
  const { data: wards } = useQuery({
    queryKey: ['wards'],
    queryFn: () => ipdService.listWards().then((r: any) => r.data)
  })

  // Available beds (by ward)
  const { data: beds } = useQuery({
    queryKey: ['available-beds', selectedWard],
    queryFn: () => ipdService.getAvailableBeds(selectedWard || undefined).then((r: any) => r.data),
  })

  // Patient search
  const { data: patientResults } = useQuery({
    queryKey: ['patient-search-ipd', patientSearch],
    queryFn: () => patientService.list({ search: patientSearch, size: 10 }).then((r: any) => r.data),
    enabled: patientSearch.length >= 2
  })

  const onSubmit = async (data: any) => {
    if (!selectedPatient) return toast.error('Please select a patient')
    if (!data.admitting_doctor_id || isNaN(parseInt(data.admitting_doctor_id))) {
      return toast.error('Please select an admitting doctor')
    }
    setLoading(true)
    try {
      const payload = cleanPayload({
        ...data,
        patient_id: selectedPatient.id,
        admitting_doctor_id: parseInt(data.admitting_doctor_id),
        bed_id: data.bed_id ? parseInt(data.bed_id) : undefined,
        ward_id: selectedWard || undefined,
      })
      const res = await ipdService.admit(payload)
      toast.success(`Patient admitted! ${res.data.admission_number}`)
      navigate(`/ipd/${res.data.id}`)
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Admission failed')
    } finally {
      setLoading(false)
    }
  }

  const patients = patientResults?.patients || []

  const Label = ({ text }: { text: string }) => (
    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#4C1D95', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 6 }}>
      {text}
    </label>
  )

  return (
    <div>
      <button onClick={() => navigate('/ipd')}
        style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#8B5CF6', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 20 }}>
        <ArrowLeft size={16} /> Back to IPD
      </button>

      <div style={{ marginBottom: 24 }}>
        <h1 className="page-title">Admit Patient</h1>
        <p className="page-subtitle">Create new IPD admission</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* ── Patient Search ── */}
          <div className="card">
            <p className="section-title" style={{ marginBottom: 16 }}>Patient</p>
            {selectedPatient ? (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px', background: '#F5F3FF', borderRadius: 12,
                border: '1.5px solid #C4B5FD'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'linear-gradient(135deg,#7C3AED,#4F46E5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 700, fontSize: 13
                  }}>
                    {selectedPatient.first_name?.[0]}{selectedPatient.last_name?.[0]}
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, color: '#1E1B4B', fontSize: 14 }}>
                      {selectedPatient.first_name} {selectedPatient.last_name}
                    </p>
                    <p style={{ fontSize: 12, color: '#8B5CF6' }}>
                      {selectedPatient.uhid} · {selectedPatient.phone}
                    </p>
                  </div>
                </div>
                <button type="button" onClick={() => { setSelectedPatient(null); setPatientSearch('') }}
                  style={{ fontSize: 12, color: '#DC2626', background: '#FEE2E2', border: 'none', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontWeight: 600 }}>
                  Change
                </button>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={15} color="#A78BFA" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    placeholder="Search patient by name, UHID or phone..."
                    value={patientSearch}
                    onChange={e => { setPatientSearch(e.target.value); setShowPatientList(true) }}
                    onFocus={() => setShowPatientList(true)}
                    className="input"
                    style={{ paddingLeft: 38 }}
                  />
                </div>
                {showPatientList && patientSearch.length >= 2 && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                    background: '#fff', border: '1.5px solid #EDE9FE', borderRadius: 12,
                    boxShadow: '0 8px 24px rgba(124,58,237,0.12)', marginTop: 4, overflow: 'hidden'
                  }}>
                    {patients.length === 0 ? (
                      <div style={{ padding: '16px', textAlign: 'center', color: '#A78BFA', fontSize: 13 }}>
                        No patients found
                      </div>
                    ) : patients.map((p: any) => (
                      <div key={p.id} onClick={() => { setSelectedPatient(p); setShowPatientList(false) }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '10px 14px', cursor: 'pointer',
                          borderBottom: '1px solid #F3F0FF'
                        }}
                        onMouseOver={e => (e.currentTarget.style.background = '#F5F3FF')}
                        onMouseOut={e => (e.currentTarget.style.background = '#fff')}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: '#EDE9FE', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontWeight: 700, fontSize: 12, color: '#7C3AED'
                        }}>
                          {p.first_name?.[0]}{p.last_name?.[0]}
                        </div>
                        <div>
                          <p style={{ fontWeight: 600, color: '#1E1B4B', fontSize: 13 }}>
                            {p.first_name} {p.last_name}
                          </p>
                          <p style={{ fontSize: 11, color: '#A78BFA' }}>{p.uhid} · {p.phone}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Doctor & Admission Type ── */}
          <div className="card">
            <p className="section-title" style={{ marginBottom: 16 }}>Doctor & Admission</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <Label text="Admitting Doctor *" />
                <DoctorSearchInput inputCls={inputCls} onSelect={(id) => setValue('admitting_doctor_id', String(id))} />
                <p style={{ fontSize: 11, color: '#A78BFA', marginTop: 4 }}>
                  
                </p>
              </div>
              <div>
                <Label text="Admission Type" />
                <CustomSelect value={watch('admission_type') || ''} onChange={v => setValue('admission_type', String(v))} placeholder="— Select —" options={[{ value: '', label: '— Select —' }, { value: "elective", label: "Elective" }, { value: "emergency", label: "Emergency" }, { value: "transfer", label: "Transfer" }, { value: "day_care", label: "Day Care" }]} />
              </div>
              <div>
                <Label text="Expected Discharge Date" />
                <input {...register('expected_discharge_date')} type="date" className="input" />
              </div>
            </div>
          </div>

          {/* ── Bed Allocation ── */}
          <div className="card">
            <p className="section-title" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <BedDouble size={16} color="#7C3AED" /> Bed Allocation
            </p>

            {(!wards || wards.length === 0) && (
              <div style={{ background: '#FEF3C7', borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
                <p style={{ fontSize: 13, color: '#B45309', fontWeight: 600 }}>
                  ⚠️ No wards found. Please add wards from the backend.
                </p>
                <p style={{ fontSize: 12, color: '#B45309', marginTop: 4 }}>
                  Contact your administrator to set up ward data.
                </p>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <Label text="Ward" />
                <select className="input" style={{ appearance: 'auto' }}
                  onChange={e => setSelectedWard(e.target.value ? parseInt(e.target.value) : null)}>
                  <option value="">— Select Ward —</option>
                  {(wards || []).map((w: any) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.ward_type?.replace('_', ' ')}) — {w.available_beds ?? '?'} beds free
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label text="Bed" />
                <select {...register('bed_id')} className="input" style={{ appearance: 'auto' }}>
                  <option value="">— Select Bed —</option>
                  {(beds || []).map((b: any) => (
                    <option key={b.id} value={b.id}>
                      {b.bed_number} — {b.bed_type}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Bed visual grid */}
            {beds && beds.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <p style={{ fontSize: 12, color: '#A78BFA', marginBottom: 8 }}>
                  {beds.length} available bed(s)
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {beds.slice(0, 24).map((b: any) => (
                    <div key={b.id} style={{
                      background: '#DCFCE7', border: '1px solid #86EFAC',
                      borderRadius: 8, padding: '4px 12px',
                      fontSize: 12, fontWeight: 600, color: '#15803D'
                    }}>
                      {b.bed_number}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Clinical Info ── */}
          <div className="card">
            <p className="section-title" style={{ marginBottom: 16 }}>Clinical Information</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <Label text="Chief Complaint" />
                <textarea {...register('chief_complaint')} rows={2} className="input"
                  placeholder="Patient's chief complaint..." style={{ resize: 'vertical' }} />
              </div>
              <div>
                <Label text="Diagnosis at Admission" />
                <input {...register('diagnosis_at_admission')} className="input"
                  placeholder="Provisional diagnosis" />
              </div>
              <div>
                <Label text="Transferred From" />
                <input {...register('transferred_from')} className="input"
                  placeholder="Previous hospital/ward (if transfer)" />
              </div>
            </div>
          </div>

          {/* ── Insurance ── */}
          <div className="card">
            <p className="section-title" style={{ marginBottom: 16 }}>Insurance / TPA</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div>
                <Label text="Insurance Provider" />
                <input {...register('insurance_provider')} className="input" placeholder="Star Health, Niva Bupa..." />
              </div>
              <div>
                <Label text="Policy Number" />
                <input {...register('insurance_policy_number')} className="input" />
              </div>
              <div>
                <Label text="TPA Name" />
                <input {...register('tpa_name')} className="input" placeholder="Medi Assist, Vidal..." />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" onClick={() => navigate('/ipd')} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary"
              style={{ opacity: loading ? 0.6 : 1 }}>
              <Save size={15} />
              {loading ? 'Admitting...' : 'Admit Patient'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { labService, patientService } from '../../services/api'
import { DoctorSearchInput } from '../../components/ui/DoctorSearchInput'
import { ArrowLeft, Search, Plus, Trash2, FlaskConical } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LabNewOrderPage() {
  const navigate = useNavigate()
  const [patientId, setPatientId] = useState('')
  const [doctorId, setDoctorId] = useState('')
  const [priority, setPriority] = useState('routine')
  const [clinicalInfo, setClinicalInfo] = useState('')
  const [search, setSearch] = useState('')
  const [selectedTests, setSelectedTests] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Patient search
  const [patientSearch, setPatientSearch] = useState('')
  const [selectedPatient, setSelectedPatient] = useState<any>(null)
  const [showPatients, setShowPatients] = useState(false)

  const { data: patientResults } = useQuery({
    queryKey: ['pt-lab', patientSearch],
    queryFn: () => patientService.list({ search: patientSearch, size: 8 }).then((r: any) => r.data),
    enabled: patientSearch.length >= 2
  })

  const { data: tests } = useQuery({
    queryKey: ['lab-tests', search],
    queryFn: () => labService.listTests({ search: search || undefined }).then(r => r.data),
  })

  const addTest = (test: any) => {
    if (!selectedTests.find(t => t.id === test.id)) {
      setSelectedTests(prev => [...prev, test])
    }
  }

  const removeTest = (id: number) => setSelectedTests(prev => prev.filter(t => t.id !== id))

  const totalCost = selectedTests.reduce((sum, t) => sum + (t.price || 0), 0)

  const handleSubmit = async () => {
    if (!patientId) return toast.error('Please select a patient')
    if (!doctorId) return toast.error('Please select a doctor')
    if (selectedTests.length === 0) return toast.error('Select at least one test')
    setLoading(true)
    try {
      const res = await labService.createOrder({
        patient_id: parseInt(patientId),
        ordered_by: parseInt(doctorId),
        priority,
        clinical_info: clinicalInfo,
        test_ids: selectedTests.map(t => t.id)
      })
      toast.success(`Lab order created: ${res.data.order_number}`)
      navigate('/lab')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to create order')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = "input"
  const CATEGORY_COLORS: Record<string, string> = {
    haematology: 'badge-red', biochemistry: 'badge-blue',
    microbiology: 'badge-green', immunology: 'badge-purple',
    urine: 'badge-amber', serology: 'badge-indigo',
    hormones: 'badge-indigo', other: 'badge-gray',
  }

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => navigate('/lab')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#8B5CF6', fontWeight: 600 }}>
          <ArrowLeft size={16} /> Back to Lab
        </button>
      </div>
      <div style={{ marginBottom: 24 }}>
        <h1 className="page-title">New Lab Order</h1>
        <p className="page-subtitle">Order laboratory tests for patient</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16 }}>

        {/* Left: test catalogue */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card">
            <div style={{ position: 'relative', marginBottom: 12 }}>
              <Search size={15} color="#A78BFA" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
              <input type="text" placeholder="Search tests by name or code..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="input" style={{ paddingLeft: 38 }} />
            </div>
            <div style={{ maxHeight: 400, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {(tests || []).map((test: any) => {
                const isSelected = selectedTests.find(t => t.id === test.id)
                return (
                  <div key={test.id} onClick={() => addTest(test)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                      background: isSelected ? '#F5F3FF' : '#fff',
                      border: `1.5px solid ${isSelected ? '#C4B5FD' : 'transparent'}`,
                      transition: 'all 0.1s'
                    }}
                    onMouseOver={e => { if (!isSelected) e.currentTarget.style.background = '#FAFAFF' }}
                    onMouseOut={e => { if (!isSelected) e.currentTarget.style.background = '#fff' }}>
                    <div>
                      <p style={{ fontSize: 13.5, fontWeight: 600, color: '#1E1B4B', margin: 0 }}>{test.test_name}</p>
                      <p style={{ fontSize: 11, color: '#A78BFA', margin: 0, fontFamily: 'monospace' }}>
                        {test.test_code} · {test.sample_type}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className={`badge ${CATEGORY_COLORS[test.category] || 'badge-gray'}`} style={{ fontSize: 10 }}>
                        {test.category}
                      </span>
                      <span style={{ fontSize: 12, color: '#6B7280' }}>₹{test.price}</span>
                      {isSelected
                        ? <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'linear-gradient(135deg,#7C3AED,#4F46E5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ color: '#fff', fontSize: 10 }}>✓</span>
                        </div>
                        : <Plus size={15} color="#A78BFA" />}
                    </div>
                  </div>
                )
              })}
              {(!tests || tests.length === 0) && (
                <p style={{ textAlign: 'center', color: '#C4B5FD', padding: '24px 0', fontSize: 13 }}>
                  No tests found. Add lab tests from Admin first.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right: order details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card">
            <p className="section-title" style={{ marginBottom: 14 }}>Order Details</p>

            {/* Patient search */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#4C1D95', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 5 }}>
                Patient *
              </label>
              {selectedPatient ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', border: '1.5px solid #C4B5FD', borderRadius: 10, background: '#F5F3FF' }}>
                  <div>
                    <p style={{ fontWeight: 600, color: '#1E1B4B', fontSize: 13, margin: 0 }}>{selectedPatient.first_name} {selectedPatient.last_name}</p>
                    <p style={{ fontSize: 11, color: '#8B5CF6', margin: 0 }}>{selectedPatient.uhid}</p>
                  </div>
                  <button type="button" onClick={() => { setSelectedPatient(null); setPatientId(''); setPatientSearch('') }}
                    style={{ fontSize: 11, color: '#DC2626', background: '#FEE2E2', border: 'none', borderRadius: 6, padding: '3px 8px', cursor: 'pointer' }}>✕</button>
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  <Search size={13} color="#A78BFA" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                  <input type="text" placeholder="Search name, UHID..."
                    value={patientSearch}
                    onChange={e => { setPatientSearch(e.target.value); setShowPatients(true) }}
                    onFocus={() => setShowPatients(true)}
                    onBlur={() => setTimeout(() => setShowPatients(false), 200)}
                    className="input" style={{ paddingLeft: 30 }} />
                  {showPatients && patientSearch.length >= 2 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, background: '#fff', border: '1.5px solid #EDE9FE', borderRadius: 10, boxShadow: '0 8px 24px rgba(124,58,237,0.12)', marginTop: 3, overflow: 'hidden' }}>
                      {(patientResults?.patients || []).length === 0
                        ? <div style={{ padding: '10px', textAlign: 'center', color: '#A78BFA', fontSize: 12 }}>No patients found</div>
                        : (patientResults?.patients || []).map((p: any) => (
                          <div key={p.id} onMouseDown={() => { setSelectedPatient(p); setPatientId(String(p.id)); setShowPatients(false) }}
                            style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #F3F0FF' }}
                            onMouseOver={e => (e.currentTarget.style.background = '#F5F3FF')}
                            onMouseOut={e => (e.currentTarget.style.background = '#fff')}>
                            <p style={{ fontWeight: 600, color: '#1E1B4B', fontSize: 12, margin: 0 }}>{p.first_name} {p.last_name}</p>
                            <p style={{ fontSize: 11, color: '#A78BFA', margin: 0 }}>{p.uhid}</p>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Doctor dropdown */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#4C1D95', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 5 }}>
                Doctor *
              </label>
              <DoctorSearchInput inputCls="input" onSelect={(id) => setDoctorId(id ? String(id) : '')} />
            </div>

            {/* Priority */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#4C1D95', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 5 }}>Priority</label>
              <select value={priority} onChange={e => setPriority(e.target.value)} className="input" style={{ appearance: 'auto' }}>
                <option value="routine">Routine</option>
                <option value="urgent">Urgent</option>
                <option value="stat">STAT (Immediate)</option>
              </select>
            </div>

            {/* Clinical Info */}
            <div>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#4C1D95', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 5 }}>Clinical Info</label>
              <textarea value={clinicalInfo} onChange={e => setClinicalInfo(e.target.value)}
                rows={2} className="input" placeholder="Clinical notes for lab..."
                style={{ resize: 'vertical' as const }} />
            </div>
          </div>

          {/* Selected tests */}
          <div className="card">
            <p className="section-title" style={{ marginBottom: 12 }}>Selected Tests ({selectedTests.length})</p>
            <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {selectedTests.map(test => (
                <div key={test.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F5F3FF', padding: '8px 12px', borderRadius: 8 }}>
                  <div>
                    <p style={{ fontSize: 12.5, fontWeight: 600, color: '#1E1B4B', margin: 0 }}>{test.test_name}</p>
                    <p style={{ fontSize: 11, color: '#8B5CF6', margin: 0 }}>₹{test.price}</p>
                  </div>
                  <button onClick={() => removeTest(test.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {selectedTests.length === 0 && (
                <p style={{ textAlign: 'center', color: '#C4B5FD', fontSize: 12, padding: '12px 0' }}>No tests selected</p>
              )}
            </div>
            {selectedTests.length > 0 && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #F3F0FF', display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 700 }}>
                <span>Total</span>
                <span style={{ color: '#7C3AED' }}>₹{totalCost.toFixed(2)}</span>
              </div>
            )}
          </div>

          <button onClick={handleSubmit} disabled={loading || selectedTests.length === 0}
            className="btn-primary" style={{ justifyContent: 'center', opacity: (loading || selectedTests.length === 0) ? 0.6 : 1 }}>
            <FlaskConical size={16} />
            {loading ? 'Creating...' : 'Create Lab Order'}
          </button>
        </div>
      </div>
    </div>
  )
}

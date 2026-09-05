import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { fhirService } from '../../services/api'
import { Share2, Search } from 'lucide-react'
import toast from 'react-hot-toast'

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none"

export default function FHIRPage() {
  const [uhid, setUhid] = useState('')
  const [patientId, setPatientId] = useState<number | null>(null)
  const [result, setResult] = useState<any>(null)

  const { data: capability } = useQuery({ queryKey: ['fhir-capability'], queryFn: () => fhirService.capabilityStatement().then(r => r.data) })

  const search = useMutation({
    mutationFn: () => fhirService.searchPatients(uhid),
    onSuccess: (res) => {
      const bundle = res.data
      if (bundle.total === 0) { toast.error('No patient found for that UHID'); setResult(null); return }
      setPatientId(parseInt(bundle.entry[0].resource.id))
      setResult(bundle.entry[0].resource)
    },
  })
  const loadObservations = useMutation({ mutationFn: () => fhirService.searchObservations(patientId!), onSuccess: (res) => setResult(res.data) })
  const loadAllergies = useMutation({ mutationFn: () => fhirService.searchAllergies(patientId!), onSuccess: (res) => setResult(res.data) })
  const loadConditions = useMutation({ mutationFn: () => fhirService.searchConditions(patientId!), onSuccess: (res) => setResult(res.data) })

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 4 }}>FHIR (Interoperability)</h1>
      <p style={{ color: '#8B5CF6', fontSize: 13, marginBottom: 6 }}>Standards-compliant REST facade — Patient, Practitioner, Encounter, Observation, AllergyIntolerance, Condition</p>
      <p style={{ color: '#9CA3AF', fontSize: 11, marginBottom: 20 }}>FHIR R4 · Capability: {capability?.fhirVersion} · {capability?.rest?.[0]?.resource?.length} resource types supported</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 20 }}>
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}><Search size={14} style={{ marginRight: 6, display: 'inline' }} />Search by UHID</h3>
          <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
            <input value={uhid} onChange={e => setUhid(e.target.value)} className={inputCls} placeholder="UHID" />
            <button onClick={() => search.mutate()} className="btn-primary" style={{ whiteSpace: 'nowrap' }}>Search</button>
          </div>
          {patientId && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#4C1D95' }}>Patient #{patientId} — related resources</p>
              <button onClick={() => loadObservations.mutate()} style={{ fontSize: 12, textAlign: 'left', color: '#7C3AED' }}>→ Observations (lab results)</button>
              <button onClick={() => loadAllergies.mutate()} style={{ fontSize: 12, textAlign: 'left', color: '#7C3AED' }}>→ AllergyIntolerance</button>
              <button onClick={() => loadConditions.mutate()} style={{ fontSize: 12, textAlign: 'left', color: '#7C3AED' }}>→ Condition</button>
            </div>
          )}
        </div>

        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}><Share2 size={14} style={{ marginRight: 6, display: 'inline' }} />FHIR Resource JSON</h3>
          {!result && <p style={{ color: '#9CA3AF', fontSize: 12 }}>Search a patient to see the FHIR-shaped response.</p>}
          {result && (
            <pre style={{ fontSize: 11, background: '#F9FAFB', padding: 12, borderRadius: 8, overflow: 'auto', maxHeight: 400 }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  )
}

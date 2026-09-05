import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { mpiService } from '../../services/api'
import { Users, Search, GitMerge } from 'lucide-react'
import toast from 'react-hot-toast'

export default function MPIPage() {
  const qc = useQueryClient()
  const { data: candidates } = useQuery({ queryKey: ['mpi-candidates'], queryFn: () => mpiService.listCandidates().then(r => r.data) })

  const scan = useMutation({
    mutationFn: () => mpiService.scan(),
    onSuccess: (res) => { qc.invalidateQueries({ queryKey: ['mpi-candidates'] }); toast.success(`Scan complete — ${res.data.candidates_found} new candidates found`) },
  })
  const review = useMutation({
    mutationFn: ({ id, status }: any) => mpiService.review(id, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['mpi-candidates'] }); toast.success('Reviewed') },
  })
  const merge = useMutation({
    mutationFn: ({ id, survivingId }: any) => mpiService.merge(id, { surviving_patient_id: survivingId }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['mpi-candidates'] }); toast.success('Merge logged — see audit trail; FK reassignment is a separate deliberate step') },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Merge failed'),
  })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <h1 className="page-title">Master Patient Index</h1>
        <button className="btn-primary" onClick={() => scan.mutate()} disabled={scan.isPending}>
          <Search size={14} style={{ marginRight: 6 }} />{scan.isPending ? 'Scanning…' : 'Scan for Duplicates'}
        </button>
      </div>
      <p style={{ color: '#8B5CF6', fontSize: 13, marginBottom: 6 }}>Duplicate-registration detection — every merge needs human review</p>
      <p style={{ color: '#9CA3AF', fontSize: 11, marginBottom: 20 }}>Fuzzy matching uses a dependency-free baseline (Python's difflib) — treat scores as a starting point for review, not a certainty.</p>

      <div className="card" style={{ padding: 16 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B', marginBottom: 10 }}><Users size={14} style={{ marginRight: 6, display: 'inline' }} />Potential Duplicates</h3>
        {candidates?.length === 0 && <p style={{ color: '#9CA3AF', fontSize: 12 }}>No pending candidates. Run a scan to check for duplicate registrations.</p>}
        {candidates?.map((c: any) => (
          <div key={c.id} style={{ padding: 12, borderBottom: '1px solid #F3F4F6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Patient #{c.patient_id_a} ↔ Patient #{c.patient_id_b}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: c.match_score > 0.8 ? '#DC2626' : '#D97706' }}>score {c.match_score}</span>
            </div>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 8 }}>{c.match_reasons?.join(', ')}</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => review.mutate({ id: c.id, status: 'confirmed_duplicate' })} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: '#FEE2E2', color: '#DC2626', border: 'none' }}>Confirm duplicate</button>
              <button onClick={() => review.mutate({ id: c.id, status: 'not_a_match' })} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: '#F3F4F6', color: '#6B7280', border: 'none' }}>Not a match</button>
              <button onClick={() => merge.mutate({ id: c.id, survivingId: c.patient_id_a })} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: '#F5F3FF', color: '#7C3AED', border: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                <GitMerge size={12} /> Merge (keep #{c.patient_id_a})
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { terminologyService } from '../../services/api'
import { BookMarked, Search, Plus } from 'lucide-react'
import toast from 'react-hot-toast'

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none"
const SYSTEMS = ['icd10', 'icd11', 'snomed_ct', 'loinc', 'rxnorm', 'cpt', 'local']

export default function TerminologyPage() {
  const qc = useQueryClient()
  const [searchQ, setSearchQ] = useState('')
  const [searchSystem, setSearchSystem] = useState('')
  const form = useForm<any>({ defaultValues: { code_system: 'local' } })

  const { data: results } = useQuery({
    queryKey: ['terminology-search', searchQ, searchSystem],
    queryFn: () => terminologyService.search({ q: searchQ || undefined, code_system: searchSystem || undefined }).then(r => r.data),
  })

  const createCode = useMutation({
    mutationFn: (d: any) => terminologyService.createCode(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['terminology-search'] }); form.reset({ code_system: 'local' }); toast.success('Code added') },
  })

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 4 }}>Terminology Repository</h1>
      <p style={{ color: '#8B5CF6', fontSize: 13, marginBottom: 6 }}>Reference codes (ICD-10, LOINC, SNOMED-CT, RxNorm) used across the system</p>
      <p style={{ color: '#D97706', fontSize: 11, marginBottom: 20 }}>⚠ Official code sets need a licensed data file (WHO/Regenstrief/SNOMED International) — this is a lookup table, not a live terminology server. Load real codes via bulk-import once you have a licensed source.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 20 }}>
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B', marginBottom: 10 }}><Plus size={14} style={{ marginRight: 6, display: 'inline' }} />Add Code</h3>
          <form onSubmit={form.handleSubmit(d => createCode.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <select {...form.register('code_system')} className={inputCls}>
              {SYSTEMS.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
            </select>
            <input {...form.register('code', { required: true })} className={inputCls} placeholder="Code" />
            <input {...form.register('display_name', { required: true })} className={inputCls} placeholder="Display name" />
            <input {...form.register('parent_code')} className={inputCls} placeholder="Parent code (optional)" />
            <button type="submit" className="btn-primary">Add Code</button>
          </form>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B', marginBottom: 10 }}><BookMarked size={14} style={{ marginRight: 6, display: 'inline' }} />Search Codes</h3>
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            <input value={searchQ} onChange={e => setSearchQ(e.target.value)} className={inputCls} placeholder="Search name or code…" />
            <select value={searchSystem} onChange={e => setSearchSystem(e.target.value)} className={inputCls} style={{ maxWidth: 130 }}>
              <option value="">All systems</option>
              {SYSTEMS.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
            </select>
          </div>
          {results?.map((r: any) => (
            <div key={r.id} style={{ padding: 8, borderBottom: '1px solid #F3F4F6', fontSize: 12 }}>
              <span style={{ fontWeight: 700, color: '#7C3AED' }}>{r.code}</span> — {r.display_name}
              <span style={{ color: '#9CA3AF', marginLeft: 8 }}>{r.code_system.toUpperCase()}</span>
            </div>
          ))}
          {results?.length === 0 && <p style={{ color: '#9CA3AF', fontSize: 12 }}>No codes match — add one, or bulk-import a licensed code set via the API.</p>}
        </div>
      </div>
    </div>
  )
}

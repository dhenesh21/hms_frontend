import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { dataGovernanceService } from '../../services/api'
import { Database, Plus, ShieldCheck, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { cleanPayload } from '../../utils/form'

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none"
const TABS = ['Assets', 'Retention', 'Quality Findings'] as const

export default function DataGovernancePage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<typeof TABS[number]>('Assets')
  const assetForm = useForm<any>({ defaultValues: { classification: 'internal', contains_phi: false } })
  const policyForm = useForm<any>({ defaultValues: { action_after_retention: 'archive' } })

  const { data: assets } = useQuery({ queryKey: ['dg-assets'], queryFn: () => dataGovernanceService.listAssets().then(r => r.data), enabled: tab === 'Assets' })
  const { data: policies } = useQuery({ queryKey: ['dg-policies'], queryFn: () => dataGovernanceService.listRetentionPolicies().then(r => r.data), enabled: tab === 'Retention' })
  const { data: findings } = useQuery({ queryKey: ['dg-findings'], queryFn: () => dataGovernanceService.listQualityFindings(false).then(r => r.data), enabled: tab === 'Quality Findings' })

  const createAsset = useMutation({
    mutationFn: (d: any) => dataGovernanceService.createAsset(cleanPayload(d)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['dg-assets'] }); assetForm.reset({ classification: 'internal', contains_phi: false }); toast.success('Asset registered') },
  })
  const createPolicy = useMutation({
    mutationFn: (d: any) => dataGovernanceService.createRetentionPolicy(cleanPayload({ ...d, data_asset_id: parseInt(d.data_asset_id), retain_for_years: parseInt(d.retain_for_years) })),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['dg-policies'] }); policyForm.reset({ action_after_retention: 'archive' }); toast.success('Retention policy created') },
  })
  const resolveFinding = useMutation({
    mutationFn: (id: number) => dataGovernanceService.resolveFinding(id, {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['dg-findings'] }); toast.success('Finding resolved') },
  })

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 4 }}>Data Governance</h1>
      <p style={{ color: '#8B5CF6', fontSize: 13, marginBottom: 20 }}>Data asset catalog, retention policy, and quality findings</p>

      <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid #E5E7EB' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '8px 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              color: tab === t ? '#7C3AED' : '#6B7280', borderBottom: tab === t ? '2px solid #7C3AED' : '2px solid transparent' }}>{t}</button>
        ))}
      </div>

      {tab === 'Assets' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 20 }}>
          <div className="card" style={{ padding: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}><Plus size={14} style={{ marginRight: 6, display: 'inline' }} />Register Data Asset</h3>
            <form onSubmit={assetForm.handleSubmit(d => createAsset.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input {...assetForm.register('table_name', { required: true })} className={inputCls} placeholder="Table name (e.g. patient_allergies)" />
              <input {...assetForm.register('domain')} className={inputCls} placeholder="Domain (e.g. clinical)" />
              <select {...assetForm.register('classification')} className={inputCls}>
                <option value="public">Public</option><option value="internal">Internal</option><option value="confidential">Confidential</option><option value="restricted">Restricted</option>
              </select>
              <input {...assetForm.register('business_owner')} className={inputCls} placeholder="Business owner (team/role)" />
              <label style={{ display: 'flex', gap: 6, fontSize: 12 }}><input type="checkbox" {...assetForm.register('contains_phi')} /> Contains PHI</label>
              <button type="submit" className="btn-primary">Register</button>
            </form>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}><Database size={14} style={{ marginRight: 6, display: 'inline' }} />Asset Catalog</h3>
            {assets?.map((a: any) => (
              <div key={a.id} style={{ padding: 8, borderBottom: '1px solid #F3F4F6', fontSize: 12 }}>
                <span style={{ fontWeight: 600 }}>{a.table_name}</span>
                <span style={{ marginLeft: 8, color: a.classification === 'restricted' ? '#DC2626' : '#9CA3AF' }}>{a.classification}</span>
                {a.contains_phi && <span style={{ marginLeft: 8, color: '#D97706', fontSize: 10, fontWeight: 700 }}>PHI</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'Retention' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 20 }}>
          <div className="card" style={{ padding: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}><Plus size={14} style={{ marginRight: 6, display: 'inline' }} />New Policy</h3>
            <form onSubmit={policyForm.handleSubmit(d => createPolicy.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input {...policyForm.register('data_asset_id', { required: true })} className={inputCls} placeholder="Data asset ID" />
              <input {...policyForm.register('retain_for_years', { required: true })} className={inputCls} placeholder="Retain for (years)" />
              <select {...policyForm.register('action_after_retention')} className={inputCls}>
                <option value="retain">Retain</option><option value="archive">Archive</option><option value="anonymize">Anonymize</option><option value="delete">Delete</option>
              </select>
              <input {...policyForm.register('legal_basis')} className={inputCls} placeholder="Legal basis" />
              <button type="submit" className="btn-primary">Create Policy</button>
            </form>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}><ShieldCheck size={14} style={{ marginRight: 6, display: 'inline' }} />Active Policies</h3>
            {policies?.map((p: any) => (
              <div key={p.id} style={{ padding: 8, borderBottom: '1px solid #F3F4F6', fontSize: 12 }}>
                Asset #{p.data_asset_id} — retain {p.retain_for_years}y, then {p.action_after_retention}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'Quality Findings' && (
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}><AlertTriangle size={14} style={{ marginRight: 6, display: 'inline' }} />Open Findings</h3>
          {findings?.length === 0 && <p style={{ color: '#9CA3AF', fontSize: 12 }}>No open data quality findings.</p>}
          {findings?.map((f: any) => (
            <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', padding: 10, borderBottom: '1px solid #F3F4F6', fontSize: 12 }}>
              <span>Rule #{f.rule_id} — {f.affected_table} #{f.affected_record_id}</span>
              <button onClick={() => resolveFinding.mutate(f.id)} style={{ color: '#059669' }}>Resolve</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

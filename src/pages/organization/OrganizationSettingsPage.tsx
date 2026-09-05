import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { organizationService } from '../../services/api'
import { Building2, Percent, Wallet, Star } from 'lucide-react'
import toast from 'react-hot-toast'
import { cleanPayload } from '../../utils/form'

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none"
const TABS = ['Branches', 'Tax Rates', 'Payment Modes']

export default function OrganizationSettingsPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState(0)
  const branchForm = useForm<any>()
  const taxForm = useForm<any>()
  const pmForm = useForm<any>()

  const { data: branches } = useQuery({
    queryKey: ['org-branches'],
    queryFn: () => organizationService.listBranches().then(r => r.data),
  })
  const { data: taxRates } = useQuery({
    queryKey: ['org-tax-rates'],
    queryFn: () => organizationService.listTaxRates().then(r => r.data),
  })
  const { data: paymentModes } = useQuery({
    queryKey: ['org-payment-modes'],
    queryFn: () => organizationService.listPaymentModes().then(r => r.data),
  })

  const createBranch = useMutation({
    mutationFn: (d: any) => organizationService.createBranch(cleanPayload(d)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['org-branches'] })
      branchForm.reset()
      toast.success('Branch added')
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Failed to add branch'),
  })

  const createTaxRate = useMutation({
    mutationFn: (d: any) => organizationService.createTaxRate(cleanPayload(d)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['org-tax-rates'] })
      taxForm.reset()
      toast.success('Tax rate added')
    },
    onError: () => toast.error('Failed to add tax rate'),
  })

  const setDefaultTax = useMutation({
    mutationFn: (id: number) => organizationService.setDefaultTaxRate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['org-tax-rates'] })
      toast.success('Default tax rate updated')
    },
    onError: () => toast.error('Failed to update'),
  })

  const createPaymentMode = useMutation({
    mutationFn: (d: any) => organizationService.createPaymentMode(cleanPayload(d)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['org-payment-modes'] })
      pmForm.reset()
      toast.success('Payment mode added')
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Failed to add payment mode'),
  })

  const togglePaymentMode = useMutation({
    mutationFn: (id: number) => organizationService.togglePaymentMode(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['org-payment-modes'] })
      toast.success('Payment mode updated')
    },
    onError: () => toast.error('Failed to update'),
  })

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 className="page-title">Organization Settings</h1>
        <p style={{ color: '#8B5CF6', fontSize: 13 }}>Branches · Tax rates · Payment modes</p>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid #F3F0FF' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{ padding: '8px 18px', fontSize: 13, fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer', marginBottom: -2, borderBottom: tab === i ? '2px solid #7C3AED' : '2px solid transparent', color: tab === i ? '#7C3AED' : '#9CA3AF' }}>
            {t}
          </button>
        ))}
      </div>

      {tab === 0 && (
        <div>
          <div className="card" style={{ maxWidth: 420, padding: 20, marginBottom: 20 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1E1B4B', marginBottom: 16 }}>Add Branch</h2>
            <form onSubmit={branchForm.handleSubmit(d => createBranch.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input {...branchForm.register('branch_code', { required: true })} className={inputCls} placeholder="Branch Code (unique)" />
              <input {...branchForm.register('name', { required: true })} className={inputCls} placeholder="Branch Name" />
              <input {...branchForm.register('city')} className={inputCls} placeholder="City" />
              <input {...branchForm.register('phone')} className={inputCls} placeholder="Phone" />
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#4C1D95' }}>
                <input type="checkbox" {...branchForm.register('is_head_office')} /> Head Office
              </label>
              <button type="submit" disabled={createBranch.isPending} className="btn-primary">Add Branch</button>
            </form>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxWidth: 600 }}>
            {branches?.map((b: any) => (
              <div key={b.id} className="card" style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                <Building2 size={16} color="#7C3AED" />
                <div>
                  <strong style={{ fontSize: 13 }}>{b.name}</strong>
                  <span style={{ color: '#9CA3AF', fontSize: 12 }}> ({b.branch_code}) {b.city && `· ${b.city}`}</span>
                  {b.is_head_office && <span style={{ marginLeft: 8, fontSize: 10, color: '#7C3AED', fontWeight: 700 }}>HEAD OFFICE</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 1 && (
        <div>
          <div className="card" style={{ maxWidth: 380, padding: 20, marginBottom: 20 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1E1B4B', marginBottom: 16 }}>Add Tax Rate</h2>
            <form onSubmit={taxForm.handleSubmit(d => createTaxRate.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input {...taxForm.register('name', { required: true })} className={inputCls} placeholder="Name (e.g. GST 18%)" />
              <input {...taxForm.register('percent', { required: true })} type="number" step="0.01" className={inputCls} placeholder="Percent" />
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#4C1D95' }}>
                <input type="checkbox" {...taxForm.register('is_default')} /> Set as default
              </label>
              <button type="submit" disabled={createTaxRate.isPending} className="btn-primary">Add Tax Rate</button>
            </form>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxWidth: 500 }}>
            {taxRates?.map((t: any) => (
              <div key={t.id} className="card" style={{ padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Percent size={16} color="#7C3AED" />
                  <span style={{ fontSize: 13 }}>{t.name} ({t.percent}%)</span>
                  {t.is_default && <Star size={13} color="#D97706" fill="#D97706" />}
                </div>
                {!t.is_default && (
                  <button className="btn-ghost" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => setDefaultTax.mutate(t.id)}>Set Default</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 2 && (
        <div>
          <div className="card" style={{ maxWidth: 380, padding: 20, marginBottom: 20 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1E1B4B', marginBottom: 16 }}>Add Payment Mode</h2>
            <form onSubmit={pmForm.handleSubmit(d => createPaymentMode.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input {...pmForm.register('code', { required: true })} className={inputCls} placeholder="Code (e.g. upi, card)" />
              <input {...pmForm.register('display_name', { required: true })} className={inputCls} placeholder="Display Name" />
              <button type="submit" disabled={createPaymentMode.isPending} className="btn-primary">Add Payment Mode</button>
            </form>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxWidth: 500 }}>
            {paymentModes?.map((p: any) => (
              <div key={p.id} className="card" style={{ padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Wallet size={16} color="#7C3AED" />
                  <span style={{ fontSize: 13 }}>{p.display_name} <span style={{ color: '#9CA3AF' }}>({p.code})</span></span>
                </div>
                <button className="btn-ghost" style={{ fontSize: 11, padding: '3px 8px', color: p.is_enabled ? '#DC2626' : '#15803D' }} onClick={() => togglePaymentMode.mutate(p.id)}>
                  {p.is_enabled ? 'Disable' : 'Enable'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

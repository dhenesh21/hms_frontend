import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { pharmacyService } from '../../services/api'
import { Pill, Search, Plus, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'

// pharmacyService real methods:
// listDrugs(params?), createDrug(data), getDrugStock(drugId), addStock(data)
// listSuppliers(), createSupplier(data), createPO(data), listPOs()
// receivePO(id), dispense(data), listDispenses(params?), getAlerts(), getDashboard()

export default function PharmacyPage() {
  const [activeTab, setActiveTab] = useState<'inventory' | 'dispenses' | 'alerts' | 'purchase'>('inventory')
  const [search, setSearch] = useState('')

  const { data: stats } = useQuery({ queryKey: ['pharmacy-stats'], queryFn: () => pharmacyService.getDashboard().then((r: any) => r.data) })
  const { data: drugs } = useQuery({ queryKey: ['pharmacy-drugs', search], queryFn: () => pharmacyService.listDrugs(search ? { search } : undefined).then((r: any) => r.data) })
  const { data: dispenses } = useQuery({ queryKey: ['pharmacy-dispenses'], queryFn: () => pharmacyService.listDispenses().then((r: any) => r.data) })
  const { data: alerts } = useQuery({ queryKey: ['pharmacy-alerts'], queryFn: () => pharmacyService.getAlerts().then((r: any) => r.data) })
  const { data: pos } = useQuery({ queryKey: ['pharmacy-pos'], queryFn: () => pharmacyService.listPOs().then((r: any) => r.data) })

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Pharmacy</h1>
          <p className="page-subtitle">Drug inventory, dispensing & purchase orders</p>
        </div>
        <button className="btn-primary"><Plus size={15} /> Dispense</button>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Drugs', value: stats?.total_drugs ?? 0, cls: 'stat-icon-purple' },
          { label: 'Dispensed Today', value: stats?.dispensed_today ?? 0, cls: 'stat-icon-green' },
          { label: 'Low Stock Alerts', value: stats?.low_stock_count ?? alerts?.length ?? 0, cls: 'stat-icon-red' },
          { label: "Today's Revenue", value: `₹${(stats?.today_revenue || 0).toLocaleString()}`, cls: 'stat-icon-blue' },
        ].map(({ label, value, cls }) => (
          <div key={label} className="stat-card">
            <p style={{ fontSize: 12, color: '#8B5CF6', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{label}</p>
            <p style={{ fontSize: 26, fontWeight: 800, color: '#1E1B4B' }}>{value}</p>
          </div>
        ))}
      </div>

      <div className="tabs" style={{ marginBottom: 20 }}>
        {(['inventory', 'dispenses', 'alerts', 'purchase'] as const).map(t => (
          <button key={t} className={`tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
            {t === 'inventory' ? 'Drug Inventory' : t === 'dispenses' ? 'Dispensing' : t === 'alerts' ? 'Low Stock Alerts' : 'Purchase Orders'}
          </button>
        ))}
      </div>

      {activeTab === 'inventory' && (
        <div>
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <Search size={15} color="#A78BFA" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
            <input placeholder="Search drug name, generic name..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="input" style={{ paddingLeft: 40 }} />
          </div>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Drug</th><th>Generic</th><th>Category</th><th>Unit</th><th>Reorder Level</th></tr></thead>
              <tbody>
                {!(drugs?.length) ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px 0', color: '#C4B5FD', fontSize: 13 }}>No drugs found</td></tr>
                ) : (drugs || []).map((d: any) => (
                  <tr key={d.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Pill size={15} color="#7C3AED" />
                        </div>
                        <p style={{ fontWeight: 600, color: '#1E1B4B', fontSize: 13 }}>{d.name}</p>
                      </div>
                    </td>
                    <td style={{ color: '#6B7280', fontSize: 13 }}>{d.generic_name || '—'}</td>
                    <td><span className="badge badge-blue" style={{ fontSize: 10 }}>{d.category || '—'}</span></td>
                    <td style={{ color: '#374151', fontSize: 13 }}>{d.unit || '—'}</td>
                    <td style={{ fontWeight: 600, color: '#D97706', fontSize: 13 }}>{d.reorder_level ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'dispenses' && (
        <div className="table-wrapper">
          <table>
            <thead><tr>
              <th>Dispense ID</th><th>Patient</th><th>Drug</th>
              <th>Qty</th><th>Dispensed By</th><th>Date</th>
            </tr></thead>
            <tbody>
              {!(dispenses?.length) ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px 0', color: '#C4B5FD', fontSize: 13 }}>No dispense records</td></tr>
              ) : (dispenses || []).map((d: any) => (
                <tr key={d.id}>
                  <td><span style={{ fontFamily: 'monospace', color: '#7C3AED', fontWeight: 600, fontSize: 12 }}>DISP-{d.id}</span></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="avatar avatar-sm avatar-green">{d.patient_name?.[0] || 'P'}</div>
                      <span style={{ fontWeight: 600, color: '#1E1B4B', fontSize: 13 }}>{d.patient_name || '—'}</span>
                    </div>
                  </td>
                  <td style={{ color: '#4C1D95', fontWeight: 600, fontSize: 13 }}>{d.drug_name}</td>
                  <td style={{ fontWeight: 700, color: '#1E1B4B', fontSize: 13 }}>{d.quantity} {d.unit}</td>
                  <td style={{ color: '#374151', fontSize: 13 }}>{d.dispensed_by_name || '—'}</td>
                  <td style={{ color: '#6B7280', fontSize: 12 }}>{d.dispensed_at ? format(new Date(d.dispensed_at), 'dd MMM HH:mm') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'alerts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {!(alerts?.length) ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#C4B5FD' }}>
              <p style={{ fontSize: 14 }}>✅ No low stock alerts</p>
            </div>
          ) : (alerts || []).map((a: any) => (
            <div key={a.id} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 18px', background: '#FEF2F2',
              borderRadius: 12, border: '1px solid #FECACA'
            }}>
              <AlertCircle size={20} color="#DC2626" />
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700, color: '#1E1B4B', fontSize: 13 }}>{a.drug_name}</p>
                <p style={{ fontSize: 12, color: '#6B7280' }}>
                  Current: <strong style={{ color: '#DC2626' }}>{a.current_stock}</strong> · Reorder level: {a.reorder_level}
                </p>
              </div>
              <button className="btn-primary" style={{ padding: '6px 14px', fontSize: 12 }}>Order Stock</button>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'purchase' && (
        <div className="table-wrapper">
          <table>
            <thead><tr>
              <th>PO Number</th><th>Supplier</th><th>Items</th>
              <th>Total</th><th>Status</th><th>Date</th>
            </tr></thead>
            <tbody>
              {!(pos?.length) ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px 0', color: '#C4B5FD', fontSize: 13 }}>No purchase orders</td></tr>
              ) : (pos || []).map((p: any) => (
                <tr key={p.id}>
                  <td><span style={{ fontFamily: 'monospace', color: '#7C3AED', fontWeight: 600, fontSize: 12 }}>PO-{p.id}</span></td>
                  <td style={{ fontWeight: 600, color: '#1E1B4B', fontSize: 13 }}>{p.supplier_name}</td>
                  <td style={{ color: '#374151', fontSize: 13 }}>{p.items?.length || 0} items</td>
                  <td style={{ fontWeight: 700, color: '#1E1B4B', fontSize: 13 }}>₹{p.total_amount?.toLocaleString()}</td>
                  <td>
                    <span className={`badge ${p.status === 'received' ? 'badge-green' : p.status === 'pending' ? 'badge-amber' : 'badge-blue'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td style={{ color: '#6B7280', fontSize: 12 }}>{p.created_at ? format(new Date(p.created_at), 'dd MMM yy') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

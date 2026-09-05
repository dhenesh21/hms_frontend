import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { reportsService } from '../../services/api'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { TrendingUp, Users, Bed, FlaskConical, IndianRupee, Shield, Calendar, Download } from 'lucide-react'
import { format, subDays, startOfYear, subYears } from 'date-fns'
import toast from 'react-hot-toast'

const COLORS = ['#7c3aed','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316']

const TABS = ['MIS Dashboard','OPD','IPD','Revenue','Patients','Lab','Pharmacy','Insurance','Bed Occupancy','Doctor Wise']

function StatBox({ label, value, sub, color, icon: Icon }: any) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={16} className="text-white" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

export default function ReportsPage() {
  const [tab, setTab] = useState(0)
  const today = format(new Date(), 'yyyy-MM-dd')
  const monthStart = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd')
  const [fromDate, setFromDate] = useState(monthStart)
  const [toDate, setToDate] = useState(today)

  const params = { from_date: fromDate, to_date: toDate }

  const { data: mis } = useQuery({ queryKey: ['mis', fromDate, toDate], queryFn: () => reportsService.getMIS(params).then(r => r.data) })
  const { data: opd } = useQuery({ queryKey: ['opd-report', fromDate, toDate], enabled: tab === 1, queryFn: () => reportsService.getOPD(params).then(r => r.data) })
  const { data: ipd } = useQuery({ queryKey: ['ipd-report', fromDate, toDate], enabled: tab === 2, queryFn: () => reportsService.getIPD(params).then(r => r.data) })
  const { data: rev } = useQuery({ queryKey: ['rev-report', fromDate, toDate], enabled: tab === 3, queryFn: () => reportsService.getRevenue(params).then(r => r.data) })
  const { data: patients } = useQuery({ queryKey: ['pat-report', fromDate, toDate], enabled: tab === 4, queryFn: () => reportsService.getPatients(params).then(r => r.data) })
  const { data: lab } = useQuery({ queryKey: ['lab-report', fromDate, toDate], enabled: tab === 5, queryFn: () => reportsService.getLab(params).then(r => r.data) })
  const { data: pharmacy } = useQuery({ queryKey: ['pharma-report', fromDate, toDate], enabled: tab === 6, queryFn: () => reportsService.getPharmacy(params).then(r => r.data) })
  const { data: insurance } = useQuery({ queryKey: ['ins-report', fromDate, toDate], enabled: tab === 7, queryFn: () => reportsService.getInsurance(params).then(r => r.data) })
  const { data: beds } = useQuery({ queryKey: ['beds-report'], enabled: tab === 8, queryFn: () => reportsService.getBedOccupancy().then(r => r.data) })
  const { data: doctors } = useQuery({ queryKey: ['doctor-report', fromDate, toDate], enabled: tab === 9, queryFn: () => reportsService.getDoctorWise(params).then(r => r.data) })

  const inputCls = "px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none"

  const downloadCSV = () => {
    const tabName = TABS[tab]
    const dataMap: Record<number, any> = {
      0: mis, 1: opd, 2: ipd, 3: rev, 4: patients, 5: lab, 6: pharmacy, 7: insurance, 9: doctors
    }
    const rawData = dataMap[tab]
    if (!rawData) return toast.error('No data to download')

    // Flatten the data for CSV
    const flatten = (obj: any, prefix = ''): Record<string, any> => {
      return Object.keys(obj).reduce((acc: any, k) => {
        const pre = prefix ? `${prefix}_${k}` : k
        if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
          Object.assign(acc, flatten(obj[k], pre))
        } else if (!Array.isArray(obj[k])) {
          acc[pre] = obj[k]
        }
        return acc
      }, {})
    }

    const flat = flatten(rawData)
    const rows = Object.entries(flat).map(([k, v]) => `${k},${v}`)
    const csv = `Report: ${tabName}\nPeriod: ${fromDate} to ${toDate}\n\nField,Value\n${rows.join('\n')}`
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${tabName.replace(/\s+/g, '_')}_${fromDate}_${toDate}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const downloadPDF = () => {
    const tabName = TABS[tab]
    const dataMap: Record<number, any> = { 0: mis, 1: opd, 2: ipd, 3: rev, 4: patients, 5: lab, 6: pharmacy, 7: insurance, 9: doctors }
    const rawData = dataMap[tab]
    if (!rawData) return toast.error('No data to download')

    const flatten = (obj: any, prefix = ''): Record<string, any> => {
      return Object.keys(obj).reduce((acc: any, k) => {
        const pre = prefix ? `${prefix}_${k}` : k
        if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) { Object.assign(acc, flatten(obj[k], pre)) }
        else if (!Array.isArray(obj[k])) { acc[pre] = obj[k] }
        return acc
      }, {})
    }
    const flat = flatten(rawData)
    const rows = Object.entries(flat).map(([k, v]) => `<tr><td style="padding:6px 12px;border:1px solid #EDE9FE;font-size:12px;color:#4B5563">${k.replace(/_/g,' ')}</td><td style="padding:6px 12px;border:1px solid #EDE9FE;font-size:12px;font-weight:600;color:#1E1B4B">${v}</td></tr>`).join('')

    const win = window.open('', '_blank', 'width=800,height=600')
    if (!win) return toast.error('Allow popups to download PDF')
    const hospitalName = localStorage.getItem('setting_hospital_name') || 'HMS Hospital'
    win.document.write(`<!DOCTYPE html><html><head><title>${tabName} Report</title>
    <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;padding:30px;color:#1E1B4B}
    .header{text-align:center;border-bottom:3px solid #7C3AED;padding-bottom:12px;margin-bottom:20px}
    h1{font-size:22px;color:#7C3AED}h2{font-size:16px;margin-bottom:12px;color:#4C1D95}
    table{width:100%;border-collapse:collapse}th{background:#F5F3FF;color:#7C3AED;padding:8px 12px;font-size:11px;text-align:left;text-transform:uppercase;border:1px solid #EDE9FE}
    .footer{margin-top:20px;padding-top:10px;border-top:1px solid #EDE9FE;font-size:10px;color:#9CA3AF;text-align:center}
    @media print{body{padding:10px}}</style></head>
    <body>
    <div class="header"><h1>${hospitalName}</h1><p style="color:#8B5CF6;font-size:13px;margin-top:4px">Health. Care. First.</p></div>
    <h2>${tabName} Report</h2>
    <p style="font-size:12px;color:#6B7280;margin-bottom:16px">Period: <strong>${fromDate}</strong> to <strong>${toDate}</strong></p>
    <table><thead><tr><th>Field</th><th>Value</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="footer">Generated on ${new Date().toLocaleString('en-IN')} · ${hospitalName}</div>
    <script>window.onload=()=>{window.print();window.onafterprint=()=>window.close()}<\/script>
    </body></html>`)
    win.document.close()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Reports & Analytics</h1>
          <p className="page-subtitle">MIS · Clinical · Financial · Operational</p>
        </div>
        {/* Date Range */}
        <div className="flex items-center gap-2 flex-wrap">
          <Calendar size={15} className="text-gray-400" />
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className={inputCls} />
          <span className="text-gray-400 text-sm">to</span>
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className={inputCls} />
          <div className="flex gap-1 flex-wrap">
            {[
              { label: 'Today', fn: () => { setFromDate(today); setToDate(today) } },
              { label: 'This Month', fn: () => { setFromDate(monthStart); setToDate(today) } },
              { label: '30 Days', fn: () => { setFromDate(format(subDays(new Date(), 30), 'yyyy-MM-dd')); setToDate(today) } },
              { label: 'This Year', fn: () => { setFromDate(format(startOfYear(new Date()), 'yyyy-MM-dd')); setToDate(today) } },
              { label: '2 Years', fn: () => { setFromDate(format(subYears(new Date(), 2), 'yyyy-MM-dd')); setToDate(today) } },
            ].map(({ label, fn }) => (
              <button key={label} onClick={fn}
                style={{ padding: '5px 10px', fontSize: 12, borderRadius: 6, border: '1.5px solid #EDE9FE', background: '#F5F3FF', color: '#7C3AED', cursor: 'pointer', fontWeight: 500 }}>
                {label}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={downloadCSV}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', fontSize: 12, fontWeight: 600, borderRadius: 8, border: '1.5px solid #DDD6FE', background: '#F5F3FF', color: '#7C3AED', cursor: 'pointer' }}>
            <Download size={13} /> CSV
          </button>
          <button onClick={downloadPDF}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', fontSize: 12, fontWeight: 600, borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#7C3AED,#4F46E5)', color: '#fff', cursor: 'pointer' }}>
            <Download size={13} /> PDF
          </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 flex-wrap bg-gray-100 p-1 rounded-lg">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition whitespace-nowrap
              ${tab === i ? 'tab active' : 'tab'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* MIS DASHBOARD */}
      {tab === 0 && mis && (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <StatBox label="OPD Visits" value={mis.opd?.total_visits} sub="Outpatients" color="bg-violet-500" icon={Users} />
            <StatBox label="IPD Admissions" value={mis.ipd?.total_admissions} sub={`${mis.ipd?.current_admitted} currently admitted`} color="bg-green-500" icon={Bed} />
            <StatBox label="Revenue Collected" value={`₹${(mis.revenue?.total_collected || 0).toLocaleString()}`} sub={`Billed: ₹${(mis.revenue?.total_billed || 0).toLocaleString()}`} color="bg-purple-500" icon={IndianRupee} />
            <StatBox label="New Patients" value={mis.patients?.new_this_period} sub={`Total: ${mis.patients?.total_registered}`} color="bg-amber-500" icon={Users} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 card">
              <h2 className="section-title" style={{marginBottom:16}}>Period Summary</h2>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Lab Orders', value: mis.lab?.total_orders, sub: `${mis.lab?.approved} approved`, color: 'text-violet-600' },
                  { label: 'Pharmacy Revenue', value: `₹${(mis.pharmacy?.revenue || 0).toLocaleString()}`, sub: `${mis.pharmacy?.total_dispenses} dispenses`, color: 'text-green-600' },
                  { label: 'Outstanding', value: `₹${(mis.revenue?.outstanding || 0).toLocaleString()}`, sub: 'Pending collection', color: 'text-red-500' },
                  { label: 'Insurance Claims', value: mis.insurance?.total_claims, sub: `${mis.insurance?.settled} settled`, color: 'text-purple-600' },
                  { label: 'Available Beds', value: mis.ipd?.available_beds, sub: 'Currently free', color: 'text-teal-600' },
                  { label: 'Pharmacy Dispenses', value: mis.pharmacy?.total_dispenses, sub: 'This period', color: 'text-amber-600' },
                ].map(({ label, value, sub, color }) => (
                  <div key={label} className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-400">{label}</p>
                    <p className={`text-lg font-bold ${color}`}>{value ?? '—'}</p>
                    <p className="text-xs text-gray-400">{sub}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <h2 className="section-title" style={{marginBottom:16}}>Quick Navigation</h2>
              <div className="space-y-2">
                {TABS.slice(1).map((t, i) => (
                  <button key={t} onClick={() => setTab(i + 1)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-violet-50 hover:text-violet-700 rounded-lg transition flex justify-between items-center">
                    <span>{t}</span>
                    <span className="text-gray-300">→</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OPD REPORT */}
      {tab === 1 && opd && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Visits', value: opd.total_visits, color: 'text-violet-600' },
              { label: 'Completed', value: opd.completed, color: 'text-green-600' },
              { label: 'Follow-ups Scheduled', value: opd.follow_ups_scheduled, color: 'text-amber-600' },
            ].map(({ label, value, color }) => (
              <div key={label} className="card">
                <p className={`text-2xl font-bold ${color}`}>{value ?? 0}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="card">
              <h2 className="section-title" style={{marginBottom:16}}>Daily OPD Visits</h2>
              {opd.by_day?.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={opd.by_day}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" radius={[4,4,0,0]} name="Visits" />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-center text-gray-400 py-16">No data</p>}
            </div>
            <div className="card">
              <h2 className="section-title" style={{marginBottom:16}}>Top Diagnoses</h2>
              <div className="space-y-2">
                {opd.top_diagnoses?.slice(0, 8).map((d: any, i: number) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 truncate flex-1">{d.diagnosis}</span>
                    <span className="text-sm font-semibold text-gray-800 ml-2">{d.count}</span>
                  </div>
                ))}
                {!opd.top_diagnoses?.length && <p className="text-gray-400 text-sm text-center py-6">No diagnosis data</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* IPD REPORT */}
      {tab === 2 && ipd && (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Total Admissions', value: ipd.total_admissions, color: 'text-violet-600' },
              { label: 'Discharges', value: ipd.total_discharges, color: 'text-green-600' },
              { label: 'Currently Admitted', value: ipd.current_admitted, color: 'text-amber-600' },
              { label: 'Avg Length of Stay', value: `${ipd.avg_length_of_stay_days}d`, color: 'text-purple-600' },
            ].map(({ label, value, color }) => (
              <div key={label} className="card">
                <p className={`text-2xl font-bold ${color}`}>{value ?? 0}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="card">
              <h2 className="section-title" style={{marginBottom:16}}>Admissions by Ward</h2>
              {ipd.by_ward?.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={ipd.by_ward} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis dataKey="ward" type="category" tick={{ fontSize: 10 }} width={100} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#10b981" radius={[0,4,4,0]} name="Admissions" />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-center text-gray-400 py-16">No data</p>}
            </div>
            <div className="card">
              <h2 className="section-title" style={{marginBottom:16}}>By Admission Type</h2>
              {ipd.by_type && (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={Object.entries(ipd.by_type).map(([name, value]) => ({ name, value }))}
                      cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {Object.keys(ipd.by_type).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}

      {/* REVENUE REPORT */}
      {tab === 3 && rev && (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Total Collection', value: `₹${(rev.total_collection || 0).toLocaleString()}`, color: 'text-green-600' },
              { label: 'Total Billed', value: `₹${(rev.total_billed || 0).toLocaleString()}`, color: 'text-violet-600' },
              { label: 'Outstanding', value: `₹${(rev.outstanding || 0).toLocaleString()}`, color: 'text-red-500' },
              { label: 'Bills Generated', value: rev.total_bills, color: 'text-purple-600' },
            ].map(({ label, value, color }) => (
              <div key={label} className="card">
                <p className={`text-xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="card">
              <h2 className="section-title" style={{marginBottom:16}}>Daily Collection</h2>
              {rev.by_day?.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={rev.by_day}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: any) => [`₹${v.toLocaleString()}`, 'Collection']} />
                    <Line type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : <p className="text-center text-gray-400 py-16">No data</p>}
            </div>
            <div className="card">
              <h2 className="section-title" style={{marginBottom:16}}>By Payment Mode</h2>
              {rev.by_payment_mode && Object.keys(rev.by_payment_mode).length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={Object.entries(rev.by_payment_mode).map(([name, value]) => ({ name: name.toUpperCase(), value }))}
                      cx="50%" cy="50%" outerRadius={80} dataKey="value"
                      label={({ name, value }: any) => `${name}: ₹${(value/1000).toFixed(0)}k`}>
                      {Object.keys(rev.by_payment_mode).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: any) => [`₹${v.toLocaleString()}`, 'Amount']} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p className="text-center text-gray-400 py-16">No payment data</p>}
            </div>
          </div>
        </div>
      )}

      {/* PATIENTS REPORT */}
      {tab === 4 && patients && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'New Registrations', value: patients.new_registrations, color: 'text-violet-600' },
              { label: 'Total Active', value: patients.total_active, color: 'text-green-600' },
            ].map(({ label, value, color }) => (
              <div key={label} className="card">
                <p className={`text-2xl font-bold ${color}`}>{value ?? 0}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="card">
              <h2 className="section-title" style={{marginBottom:16}}>By Gender</h2>
              {patients.by_gender && (
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={Object.entries(patients.by_gender).filter(([, v]) => (v as number) > 0).map(([name, value]) => ({ name, value: value as number }))}
                      cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {Object.keys(patients.by_gender).map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="card">
              <h2 className="section-title" style={{marginBottom:16}}>By Age Group</h2>
              {patients.by_age_group && (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={Object.entries(patients.by_age_group).map(([name, value]) => ({ name, value }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8b5cf6" radius={[4,4,0,0]} name="Patients" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="card">
              <h2 className="section-title" style={{marginBottom:16}}>By Blood Group</h2>
              <div className="space-y-2">
                {patients.by_blood_group && Object.entries(patients.by_blood_group).map(([bg, cnt]: any) => (
                  <div key={bg} className="flex justify-between items-center">
                    <span className="text-sm font-medium text-red-600">{bg}</span>
                    <span className="text-sm text-gray-700 font-semibold">{cnt}</span>
                  </div>
                ))}
                {!patients.by_blood_group || !Object.keys(patients.by_blood_group).length && <p className="text-gray-400 text-sm">No data</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LAB REPORT */}
      {tab === 5 && lab && (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Total Orders', value: lab.total_orders, color: 'text-violet-600' },
              { label: 'Total Tests', value: lab.total_tests, color: 'text-purple-600' },
              { label: 'Approved', value: lab.approved, color: 'text-green-600' },
              { label: 'Critical Results', value: lab.critical_results, color: 'text-red-500' },
            ].map(({ label, value, color }) => (
              <div key={label} className="card">
                <p className={`text-2xl font-bold ${color}`}>{value ?? 0}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            ))}
          </div>
          <div className="card">
            <h2 className="section-title" style={{marginBottom:16}}>Tests by Status</h2>
            {lab.by_status && (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={Object.entries(lab.by_status).filter(([,v]: any) => v > 0).map(([name, value]) => ({ name: name.replace(/_/g,' '), value }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#06b6d4" radius={[4,4,0,0]} name="Tests" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {/* PHARMACY REPORT */}
      {tab === 6 && pharmacy && (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Total Dispenses', value: pharmacy.total_dispenses, color: 'text-violet-600' },
              { label: 'Revenue', value: `₹${(pharmacy.total_revenue || 0).toLocaleString()}`, color: 'text-green-600' },
              { label: 'Expiring Soon', value: pharmacy.expiring_soon_batches, color: 'text-amber-600' },
              { label: 'Expired Batches', value: pharmacy.expired_batches, color: 'text-red-500' },
            ].map(({ label, value, color }) => (
              <div key={label} className="card">
                <p className={`text-xl font-bold ${color}`}>{value ?? 0}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            ))}
          </div>
          <div className="card">
            <h2 className="section-title" style={{marginBottom:16}}>Daily Pharmacy Revenue</h2>
            {pharmacy.by_day?.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={pharmacy.by_day}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: any) => [`₹${v.toLocaleString()}`, 'Revenue']} />
                  <Line type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-gray-400 py-16">No data</p>}
          </div>
        </div>
      )}

      {/* INSURANCE REPORT */}
      {tab === 7 && insurance && (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Total Claims', value: insurance.total_claims, color: 'text-violet-600' },
              { label: 'Total Claimed', value: `₹${(insurance.total_claimed || 0).toLocaleString()}`, color: 'text-purple-600' },
              { label: 'Total Approved', value: `₹${(insurance.total_approved || 0).toLocaleString()}`, color: 'text-green-600' },
              { label: 'Settlement Rate', value: `${insurance.settlement_rate}%`, color: 'text-teal-600' },
            ].map(({ label, value, color }) => (
              <div key={label} className="card">
                <p className={`text-xl font-bold ${color}`}>{value ?? 0}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            ))}
          </div>
          <div className="card">
            <h2 className="section-title" style={{marginBottom:16}}>Claims by Status</h2>
            {insurance.by_status && Object.keys(insurance.by_status).length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={Object.entries(insurance.by_status).filter(([,v]: any) => v > 0).map(([name, value]) => ({ name: name.replace(/_/g,' '), value }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[4,4,0,0]} name="Claims" />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-gray-400 py-16">No insurance data</p>}
          </div>
        </div>
      )}

      {/* BED OCCUPANCY */}
      {tab === 8 && beds && (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Total Beds', value: beds.total_beds, color: 'text-gray-700' },
              { label: 'Occupied', value: beds.total_occupied, color: 'text-red-500' },
              { label: 'Available', value: beds.total_available, color: 'text-green-600' },
              { label: 'Occupancy Rate', value: `${beds.overall_occupancy}%`, color: 'text-violet-600' },
            ].map(({ label, value, color }) => (
              <div key={label} className="card">
                <p className={`text-2xl font-bold ${color}`}>{value ?? 0}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            ))}
          </div>
          <div className="table-wrapper">
            <table className="w-full">
              <thead><tr className="bg-purple-50/50">
                {['Ward','Type','Total Beds','Occupied','Available','Occupancy %'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-purple-50">
                {beds.by_ward?.map((w: any) => (
                  <tr key={w.ward_id} className="hover:bg-purple-50/30">
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">{w.ward_name}</td>
                    <td className="px-4 py-3"><span className="text-xs badge-blue px-2 py-0.5 rounded-full capitalize">{w.ward_type?.replace(/_/g,' ')}</span></td>
                    <td className="px-4 py-3 text-sm text-gray-700">{w.total_beds}</td>
                    <td className="px-4 py-3 text-sm text-red-500 font-medium">{w.occupied}</td>
                    <td className="px-4 py-3 text-sm text-green-600 font-medium">{w.available}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full">
                          <div className="h-2 rounded-full bg-violet-500" style={{ width: `${w.occupancy_rate}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-gray-700">{w.occupancy_rate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DOCTOR WISE */}
      {tab === 9 && doctors && (
        <div className="space-y-4">
          <div className="table-wrapper">
            <div className="px-4 py-3 border-b border-purple-50">
              <h2 className="section-title">Doctor-wise OPD Summary ({doctors.doctors?.length} doctors)</h2>
            </div>
            <table className="w-full">
              <thead><tr className="bg-purple-50/50">
                {['#','Doctor Name','Specialization','OPD Visits','Follow-ups','Avg/Day'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-purple-50">
                {doctors.doctors?.map((d: any, idx: number) => {
                  const days = Math.max(1, Math.ceil((new Date(toDate).getTime() - new Date(fromDate).getTime()) / (1000*3600*24)))
                  return (
                    <tr key={d.doctor_id} className="hover:bg-purple-50/30">
                      <td className="px-4 py-3 text-xs text-gray-400">{idx + 1}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{d.doctor_name}</td>
                      <td className="px-4 py-3"><span className="text-xs badge-blue px-2 py-0.5 rounded-full">{d.specialization}</span></td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-800">{d.opd_visits}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{d.follow_ups}</td>
                      <td className="px-4 py-3 page-subtitle">{(d.opd_visits / days).toFixed(1)}</td>
                    </tr>
                  )
                })}
                {!doctors.doctors?.length && <tr><td colSpan={6} className="text-center py-10 text-gray-400">No doctor data</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

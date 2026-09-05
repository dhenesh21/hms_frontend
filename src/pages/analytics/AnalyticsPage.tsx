import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { analyticsService } from '../../services/api'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { TrendingUp, Activity, Stethoscope, IndianRupee, RotateCcw } from 'lucide-react'
import { format, subDays } from 'date-fns'

const COLORS = ['#7c3aed', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6', '#f97316']

const TABS = [
  { id: 'operational', label: 'Operational', icon: Activity },
  { id: 'clinical', label: 'Clinical', icon: Stethoscope },
  { id: 'financial', label: 'Financial', icon: IndianRupee },
] as const

const inputCls = "px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none"

export default function AnalyticsPage() {
  const [tab, setTab] = useState<typeof TABS[number]['id']>('operational')
  const [fromDate, setFromDate] = useState(format(subDays(new Date(), 90), 'yyyy-MM-dd'))
  const [toDate, setToDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [bucket, setBucket] = useState<'day' | 'week' | 'month'>('day')
  const params = { from_date: fromDate, to_date: toDate }

  const resetRange = () => {
    setFromDate(format(subDays(new Date(), 90), 'yyyy-MM-dd'))
    setToDate(format(new Date(), 'yyyy-MM-dd'))
  }

  // Operational
  const { data: patientFlow } = useQuery({
    queryKey: ['analytics-patient-flow', fromDate, toDate],
    queryFn: () => analyticsService.patientFlowTrend(params).then(r => r.data),
    enabled: tab === 'operational',
  })
  const { data: bedOccupancy } = useQuery({
    queryKey: ['analytics-bed-occupancy', fromDate, toDate],
    queryFn: () => analyticsService.bedOccupancyTrend(params).then(r => r.data),
    enabled: tab === 'operational',
  })

  // Clinical
  const { data: topDiagnoses } = useQuery({
    queryKey: ['analytics-top-diagnoses', fromDate, toDate],
    queryFn: () => analyticsService.topDiagnoses(params).then(r => r.data),
    enabled: tab === 'clinical',
  })
  const { data: readmission } = useQuery({
    queryKey: ['analytics-readmission', fromDate, toDate],
    queryFn: () => analyticsService.readmissionRate(params).then(r => r.data),
    enabled: tab === 'clinical',
  })

  // Financial
  const { data: revenueTrend } = useQuery({
    queryKey: ['analytics-revenue', fromDate, toDate, bucket],
    queryFn: () => analyticsService.revenueTrend({ ...params, bucket }).then(r => r.data),
    enabled: tab === 'financial',
  })
  const { data: paymentBreakdown } = useQuery({
    queryKey: ['analytics-payment-breakdown', fromDate, toDate],
    queryFn: () => analyticsService.paymentModeBreakdown(params).then(r => r.data),
    enabled: tab === 'financial',
  })

  const dateAxisFmt = (v: string) => {
    try { return format(new Date(v), 'dd MMM') } catch { return v }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500">Trends & breakdowns across operations, clinical outcomes and finance</p>
        </div>
      </div>

      {/* CONTROLS */}
      <div className="flex items-center gap-3 flex-wrap bg-white border border-gray-100 rounded-xl p-3 shadow-sm">
        <div className="flex bg-gray-50 rounded-lg p-1">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition ${tab === t.id ? 'bg-white shadow-sm text-violet-700' : 'text-gray-500 hover:text-gray-700'}`}>
              <t.icon size={13} /> {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className={inputCls} />
          <span className="text-xs text-gray-400">to</span>
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className={inputCls} />
          <button onClick={resetRange} title="Reset to last 90 days"
            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500">
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* OPERATIONAL */}
      {tab === 'operational' && (
        <div className="grid grid-cols-1 gap-5">
          <ChartCard title="Patient Flow Trend" subtitle="Daily OPD visits vs IPD admissions">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={patientFlow?.series || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f4" />
                <XAxis dataKey="date" tickFormatter={dateAxisFmt} tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip labelFormatter={dateAxisFmt} />
                <Legend />
                <Line type="monotone" dataKey="opd_visits" name="OPD Visits" stroke={COLORS[0]} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="ipd_admissions" name="IPD Admissions" stroke={COLORS[1]} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Bed Occupancy Trend" subtitle="Admissions vs discharges per day">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={bedOccupancy?.series || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f4" />
                <XAxis dataKey="date" tickFormatter={dateAxisFmt} tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip labelFormatter={dateAxisFmt} />
                <Legend />
                <Bar dataKey="admissions" name="Admissions" fill={COLORS[0]} radius={[3, 3, 0, 0]} />
                <Bar dataKey="discharges" name="Discharges" fill={COLORS[2]} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {/* CLINICAL */}
      {tab === 'clinical' && (
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-2">
            <ChartCard title="Top Diagnoses" subtitle={`Most frequent diagnoses, ${fromDate} to ${toDate}`}>
              <ResponsiveContainer width="100%" height={360}>
                <BarChart data={topDiagnoses?.diagnoses || []} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f4" />
                  <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="diagnosis" tick={{ fontSize: 11 }} width={140} />
                  <Tooltip />
                  <Bar dataKey="count" name="Cases" fill={COLORS[0]} radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
          <ChartCard title="Readmission Rate" subtitle="Within 30 days of discharge">
            <div className="flex flex-col items-center justify-center h-full py-8">
              <p className="text-4xl font-bold text-violet-600">{readmission?.readmission_rate_percent ?? '—'}%</p>
              <p className="text-xs text-gray-400 mt-2">{readmission?.readmitted ?? 0} of {readmission?.total_discharges ?? 0} discharges</p>
              <div className="mt-4 text-xs text-gray-500 space-y-1 w-full">
                <div className="flex justify-between"><span>Total discharges</span><span className="font-medium text-gray-700">{readmission?.total_discharges ?? 0}</span></div>
                <div className="flex justify-between"><span>Readmitted</span><span className="font-medium text-gray-700">{readmission?.readmitted ?? 0}</span></div>
              </div>
            </div>
          </ChartCard>
        </div>
      )}

      {/* FINANCIAL */}
      {tab === 'financial' && (
        <div className="grid grid-cols-1 gap-5">
          <ChartCard title="Revenue Trend" subtitle="Billed vs collected" action={
            <div className="flex bg-gray-50 rounded-lg p-0.5">
              {(['day', 'week', 'month'] as const).map(b => (
                <button key={b} onClick={() => setBucket(b)}
                  className={`text-xs px-2.5 py-1 rounded-md capitalize ${bucket === b ? 'bg-white shadow-sm text-violet-700' : 'text-gray-500'}`}>
                  {b}
                </button>
              ))}
            </div>
          }>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={revenueTrend?.series || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f4" />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: any) => `₹${Number(v).toLocaleString()}`} />
                <Legend />
                <Line type="monotone" dataKey="billed" name="Billed" stroke={COLORS[0]} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="collected" name="Collected" stroke={COLORS[1]} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <div className="grid grid-cols-2 gap-5">
            <ChartCard title="Payment Mode Breakdown" subtitle="Share of collected revenue">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={paymentBreakdown?.breakdown || []} dataKey="total_amount" nameKey="payment_mode"
                    cx="50%" cy="50%" outerRadius={90} label={(e: any) => e.payment_mode}>
                    {(paymentBreakdown?.breakdown || []).map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any) => `₹${Number(v).toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Payment Modes" subtitle="Transaction counts">
              <div className="space-y-2 py-2">
                {(paymentBreakdown?.breakdown || []).map((r: any, i: number) => (
                  <div key={r.payment_mode} className="flex items-center justify-between text-sm px-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-gray-700 capitalize">{r.payment_mode}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">₹{Number(r.total_amount).toLocaleString()}</p>
                      <p className="text-xs text-gray-400">{r.transaction_count} txns</p>
                    </div>
                  </div>
                ))}
                {!paymentBreakdown?.breakdown?.length && (
                  <p className="text-center text-gray-400 py-8 text-sm">No payment data in range</p>
                )}
              </div>
            </ChartCard>
          </div>
        </div>
      )}
    </div>
  )
}

function ChartCard({ title, subtitle, action, children }: { title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
            <TrendingUp size={14} className="text-violet-500" /> {title}
          </h2>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

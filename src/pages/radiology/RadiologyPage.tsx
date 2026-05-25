import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { radiologyService } from '../../services/api'
import { ScanLine, Plus, FileText, Clock, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const STATUS_COLORS: Record<string, string> = {
  ordered: 'bg-gray-100 text-gray-600',
  scheduled: 'bg-blue-100 text-blue-700',
  patient_arrived: 'bg-indigo-100 text-indigo-700',
  in_progress: 'bg-amber-100 text-amber-700',
  images_uploaded: 'bg-purple-100 text-purple-700',
  report_pending: 'bg-orange-100 text-orange-700',
  reported: 'bg-teal-100 text-teal-700',
  approved: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
}

const SCAN_ICONS: Record<string, string> = {
  xray: '🩻', ct: '🔬', mri: '🧲', ultrasound: '📡',
  mammogram: '🩺', echo: '❤️', ecg: '📈', pet_scan: '🔭',
}

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"

export default function RadiologyPage() {
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pending' | 'orders' | 'new'>('dashboard')
  const [reportingOrder, setReportingOrder] = useState<any>(null)
  const { register, handleSubmit, reset } = useForm()
  const reportForm = useForm()

  const { data: stats } = useQuery({
    queryKey: ['radiology-stats'],
    queryFn: () => radiologyService.getDashboard().then(r => r.data)
  })

  const { data: pending } = useQuery({
    queryKey: ['radiology-pending'],
    queryFn: () => radiologyService.getPending().then(r => r.data)
  })

  const { data: orders } = useQuery({
    queryKey: ['radiology-orders'],
    queryFn: () => radiologyService.listOrders().then(r => r.data)
  })

  const createOrder = useMutation({
    mutationFn: (d: any) => radiologyService.createOrder(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['radiology-orders'] })
      qc.invalidateQueries({ queryKey: ['radiology-stats'] })
      reset(); toast.success('Radiology order created')
      setActiveTab('pending')
    }
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      radiologyService.updateStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['radiology-pending'] }); toast.success('Status updated') }
  })

  const submitReport = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      radiologyService.submitReport(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['radiology-pending'] })
      qc.invalidateQueries({ queryKey: ['radiology-orders'] })
      setReportingOrder(null); reportForm.reset()
      toast.success('Report submitted')
    }
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Radiology</h1>
          <p className="text-sm text-gray-500">Scan orders & reporting</p>
        </div>
        <button onClick={() => setActiveTab('new')}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
          <Plus size={16} /> New Scan Order
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Today's Orders", value: stats?.today_orders, color: 'text-blue-600' },
          { label: 'Pending Reports', value: stats?.pending_reports, color: 'text-amber-600' },
          { label: 'Reported Today', value: stats?.reported_today, color: 'text-green-600' },
          { label: 'Most Common', value: stats?.by_scan_type ? Object.entries(stats.by_scan_type).sort((a: any, b: any) => b[1] - a[1])[0]?.[0]?.toUpperCase() || '—' : '—', color: 'text-purple-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className={`text-xl font-bold ${color}`}>{value ?? 0}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {(['dashboard', 'pending', 'orders', 'new'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition capitalize
              ${activeTab === t ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t === 'new' ? '+ New Order' : t}
          </button>
        ))}
      </div>

      {/* DASHBOARD - Scan type breakdown */}
      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Orders by Scan Type</h2>
            <div className="space-y-2">
              {stats?.by_scan_type && Object.entries(stats.by_scan_type)
                .sort((a: any, b: any) => b[1] - a[1])
                .map(([type, count]: any) => (
                  <div key={type} className="flex items-center gap-3">
                    <span className="text-lg w-6">{SCAN_ICONS[type] || '📋'}</span>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600 uppercase">{type.replace('_', ' ')}</span>
                        <span className="font-semibold text-gray-800">{count}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full">
                        <div className="h-1.5 bg-blue-500 rounded-full"
                          style={{ width: `${Math.min((count / Math.max(...Object.values(stats.by_scan_type) as number[])) * 100, 100)}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              {!stats?.by_scan_type && <p className="text-center text-gray-400 py-4">No data yet</p>}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              {[
                { label: 'View Pending Reports', count: stats?.pending_reports, action: () => setActiveTab('pending'), color: 'bg-amber-50 text-amber-700 hover:bg-amber-100' },
                { label: 'All Orders', count: orders?.length, action: () => setActiveTab('orders'), color: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
                { label: 'New Scan Order', count: null, action: () => setActiveTab('new'), color: 'bg-green-50 text-green-700 hover:bg-green-100' },
              ].map(({ label, count, action, color }) => (
                <button key={label} onClick={action}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition ${color}`}>
                  <span>{label}</span>
                  {count != null && <span className="bg-white bg-opacity-60 px-2 py-0.5 rounded-full text-xs">{count}</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PENDING */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {reportingOrder && (
            <div className="bg-white rounded-xl border border-blue-200 p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">
                Submit Report — {reportingOrder.order_number} ({reportingOrder.scan_type?.toUpperCase()} {reportingOrder.body_part})
              </h2>
              <form onSubmit={reportForm.handleSubmit(d => submitReport.mutate({ id: reportingOrder.id, data: d }))}
                className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Findings *</label>
                  <textarea {...reportForm.register('findings', { required: true })} rows={3}
                    className={inputCls} placeholder="Describe the findings..." />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Impression *</label>
                  <textarea {...reportForm.register('impression', { required: true })} rows={2}
                    className={inputCls} placeholder="Radiologist impression..." />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Recommendations</label>
                  <textarea {...reportForm.register('recommendations')} rows={2}
                    className={inputCls} placeholder="Follow-up recommendations..." />
                </div>
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setReportingOrder(null)}
                    className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                  <button type="submit"
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Submit Report</button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-700">Pending Orders ({pending?.length ?? 0})</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {pending?.map((o: any) => (
                <div key={o.id} className="px-4 py-3 flex items-center gap-4">
                  <span className="text-2xl">{SCAN_ICONS[o.scan_type] || '📋'}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {o.scan_type?.toUpperCase()} — {o.body_part}
                    </p>
                    <p className="text-xs text-gray-400 font-mono">{o.order_number} • Patient: {o.patient_id}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[o.status]}`}>
                      {o.status?.replace('_', ' ')}
                    </span>
                    {o.status === 'ordered' && (
                      <button onClick={() => updateStatus.mutate({ id: o.id, status: 'patient_arrived' })}
                        className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700">
                        Patient Arrived
                      </button>
                    )}
                    {o.status === 'patient_arrived' && (
                      <button onClick={() => updateStatus.mutate({ id: o.id, status: 'in_progress' })}
                        className="text-xs bg-amber-600 text-white px-3 py-1.5 rounded-lg hover:bg-amber-700">
                        Start Scan
                      </button>
                    )}
                    {o.status === 'images_uploaded' && (
                      <button onClick={() => setReportingOrder(o)}
                        className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 flex items-center gap-1">
                        <FileText size={12} /> Write Report
                      </button>
                    )}
                    {o.status === 'reported' && (
                      <button onClick={() => submitReport.mutate({ id: o.id, data: { status: 'approved' } })}
                        className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 flex items-center gap-1">
                        <CheckCircle size={12} /> Approve
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {pending?.length === 0 && (
                <div className="text-center py-12">
                  <ScanLine size={36} className="mx-auto mb-3 text-gray-200" />
                  <p className="text-gray-400">No pending orders</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ALL ORDERS */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                {['Order No.', 'Scan Type', 'Body Part', 'Patient', 'Priority', 'Status', 'Date'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders?.map((o: any) => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono text-gray-600">{o.order_number}</td>
                  <td className="px-4 py-3 text-sm text-gray-800">
                    <span className="mr-1">{SCAN_ICONS[o.scan_type] || '📋'}</span>
                    {o.scan_type?.toUpperCase()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{o.body_part}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{o.patient_id}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                      ${o.priority === 'stat' ? 'bg-red-100 text-red-700' :
                        o.priority === 'urgent' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                      {o.priority?.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[o.status]}`}>
                      {o.status?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {format(new Date(o.created_at), 'dd MMM')}
                  </td>
                </tr>
              ))}
              {!orders?.length && (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">No radiology orders</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* NEW ORDER FORM */}
      {activeTab === 'new' && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm max-w-2xl">
          <h2 className="text-sm font-semibold text-gray-700 mb-5">New Radiology Order</h2>
          <form onSubmit={handleSubmit(d => createOrder.mutate({ ...d, patient_id: parseInt(d.patient_id), ordered_by: parseInt(d.ordered_by) }))}
            className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Patient ID *</label>
                <input {...register('patient_id', { required: true })} type="number" className={inputCls} placeholder="Patient ID" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Ordered By (Doctor ID) *</label>
                <input {...register('ordered_by', { required: true })} type="number" className={inputCls} placeholder="Doctor ID" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Scan Type *</label>
                <select {...register('scan_type', { required: true })} className={`${inputCls} bg-white`}>
                  <option value="">Select scan type</option>
                  {['xray', 'ct', 'mri', 'ultrasound', 'mammogram', 'pet_scan', 'dexa', 'echo', 'ecg'].map(t => (
                    <option key={t} value={t}>{SCAN_ICONS[t]} {t.toUpperCase()}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Body Part *</label>
                <input {...register('body_part', { required: true })} className={inputCls} placeholder="e.g. Chest, Abdomen, Brain" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Priority</label>
                <select {...register('priority')} className={`${inputCls} bg-white`}>
                  <option value="routine">Routine</option>
                  <option value="urgent">Urgent</option>
                  <option value="stat">STAT</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Scheduled Date</label>
                <input {...register('scheduled_date')} type="date" className={inputCls} />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Clinical Indication</label>
              <textarea {...register('clinical_indication')} rows={2} className={inputCls}
                placeholder="Reason for scan / clinical history..." />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" {...register('contrast_required')} id="contrast" />
              <label htmlFor="contrast" className="text-sm text-gray-700">Contrast Required</label>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setActiveTab('dashboard')}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
              <button type="submit"
                className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Create Order
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

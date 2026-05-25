import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { labService } from '../../services/api'
import { FlaskConical, CheckCircle, Clock, Plus, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const STATUS_COLORS: Record<string, string> = {
  ordered: 'bg-gray-100 text-gray-600',
  sample_collected: 'bg-blue-100 text-blue-700',
  sample_received: 'bg-indigo-100 text-indigo-700',
  processing: 'bg-amber-100 text-amber-700',
  result_entered: 'bg-purple-100 text-purple-700',
  approved: 'bg-green-100 text-green-700',
  reported: 'bg-teal-100 text-teal-700',
  rejected: 'bg-red-100 text-red-700',
}

const RESULT_STATUS_COLORS: Record<string, string> = {
  normal: 'text-green-600',
  high: 'text-red-600',
  low: 'text-blue-600',
  critical: 'text-red-700 font-bold',
}

export default function LabPage() {
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState<'worklist' | 'orders' | 'results'>('worklist')
  const [selectedItems, setSelectedItems] = useState<number[]>([])

  const { data: stats } = useQuery({
    queryKey: ['lab-stats'],
    queryFn: () => labService.getDashboard().then(r => r.data)
  })

  const { data: pending } = useQuery({
    queryKey: ['lab-pending'],
    queryFn: () => labService.getPending().then(r => r.data)
  })

  const { data: orders } = useQuery({
    queryKey: ['lab-orders'],
    queryFn: () => labService.listOrders().then(r => r.data)
  })

  const collectMutation = useMutation({
    mutationFn: () => labService.collectSamples({ order_item_ids: selectedItems }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['lab-pending'] })
      setSelectedItems([])
      toast.success(`${res.data.collected} samples collected`)
    }
  })

  const approveMutation = useMutation({
    mutationFn: (itemId: number) => labService.approveResult(itemId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['lab-pending'] }); toast.success('Result approved') }
  })

  const toggleSelect = (id: number) => {
    setSelectedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const orderedItems = pending?.filter((i: any) => i.status === 'ordered') || []
  const collectedItems = pending?.filter((i: any) => i.status === 'sample_collected' || i.status === 'sample_received') || []
  const resultItems = pending?.filter((i: any) => i.status === 'result_entered') || []

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Laboratory</h1>
          <p className="text-sm text-gray-500">Lab management & worklist</p>
        </div>
        <Link to="/lab/order/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
          <Plus size={16} /> New Lab Order
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Today's Orders", value: stats?.today_orders, color: 'text-blue-600' },
          { label: 'Pending Collection', value: stats?.pending_collection, color: 'text-amber-600' },
          { label: 'Pending Approval', value: stats?.pending_approval, color: 'text-purple-600' },
          { label: 'Approved Today', value: stats?.approved_today, color: 'text-green-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className={`text-2xl font-bold ${color}`}>{value ?? 0}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {(['worklist', 'orders', 'results'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition capitalize
              ${activeTab === t ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* WORKLIST */}
      {activeTab === 'worklist' && (
        <div className="space-y-4">
          {/* Pending collection */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Clock size={15} className="text-amber-500" /> Pending Sample Collection ({orderedItems.length})
              </h2>
              {selectedItems.length > 0 && (
                <button onClick={() => collectMutation.mutate()}
                  className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700">
                  Collect {selectedItems.length} Sample(s)
                </button>
              )}
            </div>
            <div className="divide-y divide-gray-50">
              {orderedItems.map((item: any) => (
                <div key={item.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                  <input type="checkbox" checked={selectedItems.includes(item.id)}
                    onChange={() => toggleSelect(item.id)} className="rounded" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{item.test_name}</p>
                    <p className="text-xs text-gray-400 font-mono">{item.order_number} • Patient ID: {item.patient_id}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.priority === 'stat' ? 'bg-red-100 text-red-700' : item.priority === 'urgent' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                    {item.priority?.toUpperCase()}
                  </span>
                </div>
              ))}
              {orderedItems.length === 0 && <p className="text-center py-6 text-gray-400 text-sm">No samples pending collection</p>}
            </div>
          </div>

          {/* Pending results approval */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <AlertCircle size={15} className="text-purple-500" /> Pending Approval ({resultItems.length})
              </h2>
            </div>
            <div className="divide-y divide-gray-50">
              {resultItems.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.test_name}</p>
                    <p className="text-xs text-gray-400 font-mono">{item.order_number} • Barcode: {item.barcode}</p>
                  </div>
                  <button onClick={() => approveMutation.mutate(item.id)}
                    className="flex items-center gap-1 text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700">
                    <CheckCircle size={13} /> Approve
                  </button>
                </div>
              ))}
              {resultItems.length === 0 && <p className="text-center py-6 text-gray-400 text-sm">No results pending approval</p>}
            </div>
          </div>
        </div>
      )}

      {/* ORDERS */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                {['Order No.', 'Patient ID', 'Tests', 'Priority', 'Ordered At', 'Status'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders?.map((o: any) => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono text-gray-700">{o.order_number}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{o.patient_id}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{o.items?.length ?? 0} test(s)</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                      ${o.priority === 'stat' ? 'bg-red-100 text-red-700' :
                        o.priority === 'urgent' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                      {o.priority?.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {format(new Date(o.ordered_at), 'dd MMM, HH:mm')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {o.items?.map((i: any) => (
                        <span key={i.id} className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[i.status] || 'bg-gray-100 text-gray-500'}`}>
                          {i.status?.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
              {!orders?.length && (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">No lab orders</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* RESULTS */}
      {activeTab === 'results' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">Recent Results</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {orders?.flatMap((o: any) => o.items?.filter((i: any) => i.result_value || i.result_numeric) || [])
              .map((item: any) => (
                <div key={item.id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.test?.test_name}</p>
                    <p className={`text-sm font-semibold ${RESULT_STATUS_COLORS[item.result_status] || 'text-gray-700'}`}>
                      {item.result_value || item.result_numeric} {item.result_unit}
                      <span className="text-xs text-gray-400 font-normal ml-2">Normal: {item.normal_range}</span>
                    </p>
                  </div>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[item.status]}`}>
                    {item.status?.replace('_', ' ')}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}

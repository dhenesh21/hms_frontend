import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { labService } from '../../services/api'
import { ArrowLeft, Search, Plus, Trash2, FlaskConical } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LabNewOrderPage() {
  const navigate = useNavigate()
  const [patientId, setPatientId] = useState('')
  const [doctorId, setDoctorId] = useState('')
  const [priority, setPriority] = useState('routine')
  const [clinicalInfo, setClinicalInfo] = useState('')
  const [search, setSearch] = useState('')
  const [selectedTests, setSelectedTests] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const { data: tests } = useQuery({
    queryKey: ['lab-tests', search],
    queryFn: () => labService.listTests({ search: search || undefined }).then(r => r.data),
  })

  const addTest = (test: any) => {
    if (!selectedTests.find(t => t.id === test.id)) {
      setSelectedTests(prev => [...prev, test])
    }
  }

  const removeTest = (id: number) => {
    setSelectedTests(prev => prev.filter(t => t.id !== id))
  }

  const totalCost = selectedTests.reduce((sum, t) => sum + (t.price || 0), 0)

  const handleSubmit = async () => {
    if (!patientId || !doctorId) return toast.error('Patient ID and Doctor ID required')
    if (selectedTests.length === 0) return toast.error('Select at least one test')
    setLoading(true)
    try {
      const res = await labService.createOrder({
        patient_id: parseInt(patientId),
        ordered_by: parseInt(doctorId),
        priority,
        clinical_info: clinicalInfo,
        test_ids: selectedTests.map(t => t.id)
      })
      toast.success(`Lab order created: ${res.data.order_number}`)
      navigate('/lab')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to create order')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
  const CATEGORY_COLORS: Record<string, string> = {
    haematology: 'bg-red-100 text-red-700',
    biochemistry: 'bg-blue-100 text-blue-700',
    microbiology: 'bg-green-100 text-green-700',
    immunology: 'bg-purple-100 text-purple-700',
    urine: 'bg-amber-100 text-amber-700',
    serology: 'bg-pink-100 text-pink-700',
    hormones: 'bg-indigo-100 text-indigo-700',
    other: 'bg-gray-100 text-gray-600',
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/lab')} className="p-1.5 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">New Lab Order</h1>
          <p className="text-sm text-gray-500">Order laboratory tests for patient</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Left: test catalogue */}
        <div className="col-span-2 space-y-3">
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
              <input type="text" placeholder="Search tests by name or code..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="max-h-80 overflow-y-auto space-y-1">
              {tests?.map((test: any) => (
                <div key={test.id}
                  onClick={() => addTest(test)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition
                    ${selectedTests.find(t => t.id === test.id)
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-gray-50 border border-transparent'}`}>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{test.test_name}</p>
                    <p className="text-xs text-gray-400 font-mono">{test.test_code} • {test.sample_type}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[test.category] || 'bg-gray-100 text-gray-600'}`}>
                      {test.category}
                    </span>
                    <span className="text-xs text-gray-500">₹{test.price}</span>
                    {!selectedTests.find(t => t.id === test.id) ? (
                      <Plus size={15} className="text-blue-500" />
                    ) : (
                      <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {tests?.length === 0 && (
                <p className="text-center text-gray-400 py-6 text-sm">No tests found</p>
              )}
            </div>
          </div>
        </div>

        {/* Right: order details */}
        <div className="space-y-3">
          {/* Patient info */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Order Details</h3>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Patient ID *</label>
              <input value={patientId} onChange={e => setPatientId(e.target.value)}
                type="number" className={inputCls} placeholder="Patient ID" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Doctor ID *</label>
              <input value={doctorId} onChange={e => setDoctorId(e.target.value)}
                type="number" className={inputCls} placeholder="Doctor ID" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Priority</label>
              <select value={priority} onChange={e => setPriority(e.target.value)}
                className={`${inputCls} bg-white`}>
                <option value="routine">Routine</option>
                <option value="urgent">Urgent</option>
                <option value="stat">STAT (Immediate)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Clinical Info</label>
              <textarea value={clinicalInfo} onChange={e => setClinicalInfo(e.target.value)}
                rows={2} className={inputCls} placeholder="Clinical notes for lab..." />
            </div>
          </div>

          {/* Selected tests */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Selected Tests ({selectedTests.length})
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {selectedTests.map(test => (
                <div key={test.id} className="flex items-center justify-between bg-blue-50 px-3 py-2 rounded-lg">
                  <div>
                    <p className="text-xs font-medium text-gray-800">{test.test_name}</p>
                    <p className="text-xs text-gray-400">₹{test.price}</p>
                  </div>
                  <button onClick={() => removeTest(test.id)} className="text-red-400 hover:text-red-600">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {selectedTests.length === 0 && (
                <p className="text-center text-gray-400 text-xs py-3">No tests selected</p>
              )}
            </div>
            {selectedTests.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-sm font-semibold">
                <span>Total</span>
                <span className="text-blue-600">₹{totalCost.toFixed(2)}</span>
              </div>
            )}
          </div>

          <button onClick={handleSubmit} disabled={loading || selectedTests.length === 0}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 transition">
            <FlaskConical size={16} />
            {loading ? 'Creating...' : 'Create Lab Order'}
          </button>
        </div>
      </div>
    </div>
  )
}

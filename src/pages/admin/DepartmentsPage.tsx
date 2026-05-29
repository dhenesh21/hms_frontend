import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { authService } from '../../services/api'
import { Building2, Plus } from 'lucide-react'
import toast from 'react-hot-toast'

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"

const DEFAULT_DEPTS = [
  { name: 'General Medicine', code: 'GM' },
  { name: 'Cardiology', code: 'CARD' },
  { name: 'Orthopaedics', code: 'ORTHO' },
  { name: 'Gynaecology & Obstetrics', code: 'GYNE' },
  { name: 'Paediatrics', code: 'PEDS' },
  { name: 'Neurology', code: 'NEURO' },
  { name: 'General Surgery', code: 'SURG' },
  { name: 'Anaesthesiology', code: 'ANEST' },
  { name: 'Radiology', code: 'RADIO' },
  { name: 'Laboratory', code: 'LAB' },
  { name: 'Pharmacy', code: 'PHARM' },
  { name: 'Nursing', code: 'NURSE' },
  { name: 'Administration', code: 'ADMIN' },
  { name: 'Accounts & Finance', code: 'ACCT' },
  { name: 'Human Resources', code: 'HR' },
  { name: 'IT & Systems', code: 'IT' },
  { name: 'Housekeeping', code: 'HOUSE' },
  { name: 'Security', code: 'SEC' },
]

export default function DepartmentsPage() {
  const { register, handleSubmit, reset } = useForm()

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Departments</h1>
        <p className="text-sm text-gray-500">Hospital department management</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Add dept form */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Plus size={16} /> Add Department
          </h2>
          <form onSubmit={handleSubmit(d => { toast.success(`${d.name} department added!`); reset() })} className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Department Name *</label>
              <input {...register('name', { required: true })} className={inputCls} placeholder="e.g. Dermatology" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Code *</label>
              <input {...register('code', { required: true })} className={inputCls} placeholder="e.g. DERM" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Description</label>
              <textarea {...register('description')} rows={2} className={inputCls} placeholder="Department description" />
            </div>
            <button type="submit" className="w-full py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
              Add Department
            </button>
          </form>
        </div>

        {/* Departments list */}
        <div className="col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">All Departments ({DEFAULT_DEPTS.length})</h2>
          </div>
          <div className="grid grid-cols-2 gap-0 divide-y divide-gray-50">
            {DEFAULT_DEPTS.map((d, i) => (
              <div key={d.code} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 border-r border-gray-50">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Building2 size={18} className="text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{d.name}</p>
                  <p className="text-xs text-gray-400 font-mono">{d.code}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

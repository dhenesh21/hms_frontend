import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { authService } from '../../services/api'
import { UserPlus, Eye, EyeOff, Copy, CheckCircle, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"

const ROLES = [
  { value: 'doctor',         label: 'Doctor',          prefix: 'DR', color: 'bg-blue-100 text-blue-700',    desc: 'OPD, IPD, Prescriptions' },
  { value: 'nurse',          label: 'Nurse',            prefix: 'NR', color: 'bg-green-100 text-green-700',  desc: 'Nursing, MAR, Care plans' },
  { value: 'receptionist',   label: 'Receptionist',     prefix: 'RC', color: 'bg-amber-100 text-amber-700',  desc: 'Patient reg, Appointments' },
  { value: 'pharmacist',     label: 'Pharmacist',       prefix: 'PH', color: 'bg-purple-100 text-purple-700',desc: 'Pharmacy, Dispensing' },
  { value: 'lab_technician', label: 'Lab Technician',   prefix: 'LT', color: 'bg-teal-100 text-teal-700',   desc: 'Lab tests, Results' },
  { value: 'radiologist',    label: 'Radiologist',      prefix: 'RA', color: 'bg-indigo-100 text-indigo-700',desc: 'Radiology, Reports' },
  { value: 'accountant',     label: 'Accountant',       prefix: 'AC', color: 'bg-orange-100 text-orange-700',desc: 'Billing, Accounts' },
  { value: 'hr',             label: 'HR Staff',         prefix: 'HR', color: 'bg-pink-100 text-pink-700',    desc: 'HR, Payroll' },
  { value: 'admin',          label: 'Admin',            prefix: 'AD', color: 'bg-red-100 text-red-700',      desc: 'Full admin access' },
]

const DEPARTMENTS = [
  'General Medicine', 'Cardiology', 'Orthopaedics', 'Gynaecology & Obstetrics',
  'Paediatrics', 'Neurology', 'General Surgery', 'Anaesthesiology',
  'Radiology', 'Laboratory', 'Pharmacy', 'Nursing', 'Administration',
  'Accounts & Finance', 'Human Resources', 'IT & Systems',
  'Housekeeping', 'Security', 'Dietary & Canteen',
]

export default function StaffRegisterPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [selectedRole, setSelectedRole] = useState('')
  const [created, setCreated] = useState<any>(null)
  const [copied, setCopied] = useState('')

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm()

  // ✅ Better query configuration
  const { data: existingUsers = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      try {
        const response = await authService.listUsers()
        console.log('✅ Users fetched:', response.data?.length || 0)
        return response.data || []
      } catch (err) {
        console.error('❌ Error fetching users:', err)
        return []
      }
    },
    staleTime: 0,
    gcTime: 1000 * 60 * 5,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  })

  const copy = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopied(field)
    setTimeout(() => setCopied(''), 2000)
    toast.success('Copied to clipboard!')
  }

  const genPassword = () => {
    const pool = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#'
    const pass = Array.from({ length: 10 }, () => pool[Math.floor(Math.random() * pool.length)]).join('')
    setValue('password', pass)
    setShowPass(true)
  }

  const onSubmit = async (data: any) => {
    if (!selectedRole) { 
      toast.error('Please select a role!')
      return 
    }
    
    setLoading(true)
    try {
      console.log('📝 Submitting registration...', { ...data, role: selectedRole })
      
      // Step 1: Create user
      const res = await authService.createUser({ ...data, role: selectedRole })
      console.log('✅ User created successfully:', res.data)
      
      // Step 2: Refetch users list
      console.log('🔄 Refetching users list...')
      try {
        await qc.refetchQueries({ queryKey: ['users'] })
        console.log('✅ Users list refetched')
      } catch (refetchErr) {
        console.warn('⚠️ Refetch error (non-critical):', refetchErr)
        // Don't fail on refetch error - registration still succeeded
      }
      
      // Step 3: Show success
      console.log('🎉 Showing success banner')
      setCreated({ ...res.data, plain_password: data.password })
      toast.success(`${res.data.full_name} registered!`)
      reset()
      setSelectedRole('')
      
    } catch (err: any) {
      console.error('❌ Registration error:', err)
      
      // Better error message extraction
      let msg = 'Registration faed'
      
      if (err.response?.data) {
        const detail = err.response.data.detail
        if (Array.isArray(detail)) {
          msg = detail.map((e: any) => e.msg || e).join(', ')
        } else if (typeof detail === 'string') {
          msg = detail
        } else if (err.response.data.message) {
          msg = err.response.data.message
        }
      }
      
      console.error('📢 Toast error message:', msg)
      toast.error(msg)
      
    } finally {
      setLoading(false)
    }
  }

  const roleInfo = ROLES.find(r => r.value === selectedRole)

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Register New Staff</h1>
        <p className="text-sm text-gray-500">Create hospital staff login accounts</p>
      </div>

      {/* Success Banner */}
      {created && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <CheckCircle className="text-green-600 mt-0.5 flex-shrink-0" size={20} />
            <div className="flex-1">
              <p className="text-sm font-semibold text-green-800">
                ✅ {created.full_name} ({created.role}) registered successfully!
              </p>
              <p className="text-xs text-green-600 mt-1 mb-3">Share these login credentials:</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Employee ID', value: created.employee_id, key: 'id' },
                  { label: 'Email / Login', value: created.email, key: 'email' },
                  { label: 'Password', value: created.plain_password, key: 'pass' },
                ].map(({ label, value, key }) => (
                  <div key={key} className="bg-white border border-green-100 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">{label}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-gray-800 font-mono truncate">{value}</p>
                      <button onClick={() => copy(value, key)} className="text-green-600 ml-1 flex-shrink-0">
                        {copied === key ? <CheckCircle size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => setCreated(null)}
                  className="px-4 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700">
                  + Register Another
                </button>
                <button onClick={() => navigate('/admin/users')}
                  className="px-4 py-1.5 text-xs border border-green-300 text-green-700 rounded-lg hover:bg-green-50">
                  View All Staff
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-5">
        {/* Step 1 — Role */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase mb-3">Step 1 — Select Role</p>
          <div className="space-y-1.5">
            {ROLES.map(role => (
              <button key={role.value} type="button"
                onClick={() => setSelectedRole(role.value)}
                className={`w-full text-left px-3 py-2.5 rounded-lg border transition
                  ${selectedRole === role.value
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-100 hover:bg-gray-50'}`}>
                <div className="flex items-center gap-2.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${role.color}`}>
                    {role.prefix}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{role.label}</p>
                    <p className="text-xs text-gray-400">{role.desc}</p>
                  </div>
                  {selectedRole === role.value && (
                    <CheckCircle size={16} className="text-blue-600 ml-auto flex-shrink-0" />
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Role count summary */}
          {existingUsers && existingUsers.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 mb-2">Current staff count:</p>
              <div className="space-y-1">
                {ROLES.map(role => {
                  const count = existingUsers.filter((u: any) => u.role === role.value).length
                  if (!count) return null
                  return (
                    <div key={role.value} className="flex justify-between text-xs">
                      <span className="text-gray-500">{role.label}</span>
                      <span className={`font-semibold px-1.5 rounded ${role.color}`}>{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Step 2 — Form */}
        <div className="col-span-2 bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase mb-4">Step 2 — Enter Details</p>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Full Name *</label>
                <input {...register('full_name', { required: 'Full name required' })}
                  className={inputCls} placeholder="Dr. Rajesh Kumar" />
                {errors.full_name && <p className="text-red-500 text-xs mt-0.5">{errors.full_name.message as string}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email * (Login ID)</label>
                <input {...register('email', {
                  required: 'Email required',
                  pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email' }
                })} type="email" className={inputCls} placeholder="rajesh@hospital.com" />
                {errors.email && <p className="text-red-500 text-xs mt-0.5">{errors.email.message as string}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                <input {...register('phone')} className={inputCls} placeholder="+91 9876543210" />
              </div>

              {/* Department */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Department</label>
                <select {...register('department')} className={`${inputCls} bg-white`}>
                  <option value="">Select department</option>
                  {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Password *</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input {...register('password', {
                    required: 'Password required',
                    minLength: { value: 6, message: 'Min 6 characters' }
                  })} type={showPass ? 'text' : 'password'}
                    className={`${inputCls} pr-10`} placeholder="Set password" />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <button type="button" onClick={genPassword}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 whitespace-nowrap">
                  <RefreshCw size={13} /> Auto Generate
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-0.5">{errors.password.message as string}</p>}
              <p className="text-xs text-gray-400 mt-1">⚠️ Note down the password before submitting</p>
            </div>

            {/* Preview */}
            {selectedRole && (
              <div className={`rounded-lg p-3 ${roleInfo?.color} bg-opacity-30`}>
                <p className="text-xs font-medium">Account will be created as:</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className={`text-xs px-2 py-1 rounded-full font-bold ${roleInfo?.color}`}>
                    {roleInfo?.prefix}
                  </span>
                  <span className="text-sm font-semibold">{roleInfo?.label}</span>
                  <span className="text-xs text-gray-500">→ Employee ID auto-generated ({roleInfo?.prefix}0001, {roleInfo?.prefix}0002...)</span>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
              <button type="button" onClick={() => { reset(); setSelectedRole('') }}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
                Clear
              </button>
              <button type="submit" disabled={loading || !selectedRole}
                className="flex items-center gap-2 px-6 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition">
                <UserPlus size={16} />
                {loading ? 'Registering...' : `Register ${roleInfo?.label || 'Staff'}`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
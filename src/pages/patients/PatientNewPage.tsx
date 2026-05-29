import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { patientService } from '../../services/api'
import { ArrowLeft, Save } from 'lucide-react'

const SECTIONS = ['Personal', 'Contact', 'Emergency', 'Medical', 'Insurance']

function Field({ label, error, children }: any) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-0.5">{error}</p>}
    </div>
  )
}

function Input({ reg, ...props }: any) {
  return (
    <input {...reg} {...props}
      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
  )
}

function Select({ reg, children, ...props }: any) {
  return (
    <select {...reg} {...props}
      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
      {children}
    </select>
  )
}

export default function PatientNewPage() {
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState(0)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = async (data: any) => {
    setLoading(true)
    try {
      const res = await patientService.create(data)
      toast.success(`Patient registered! UHID: ${res.data.uhid}`)
      navigate(`/patients/${res.data.id}`)
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/patients')} className="p-1.5 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Register New Patient</h1>
          <p className="text-sm text-gray-500">Fill in patient details below</p>
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
        {SECTIONS.map((s, i) => (
          <button key={s} onClick={() => setActiveSection(i)}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition
              ${activeSection === i ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {s}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">

          {/* Personal */}
          {activeSection === 0 && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="First Name *" error={errors.first_name?.message as string}>
                <Input reg={register('first_name', { required: 'Required' })} placeholder="First name" />
              </Field>
              <Field label="Last Name *" error={errors.last_name?.message as string}>
                <Input reg={register('last_name', { required: 'Required' })} placeholder="Last name" />
              </Field>
              <Field label="Date of Birth *">
                <Input reg={register('date_of_birth', { required: 'Required' })} type="date" />
              </Field>
              <Field label="Gender *">
                <Select reg={register('gender', { required: 'Required' })}>
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </Select>
              </Field>
              <Field label="Blood Group">
                <Select reg={register('blood_group')}>
                  <option value="">Unknown</option>
                  {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bg => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Marital Status">
                <Select reg={register('marital_status')}>
                  <option value="">Select</option>
                  <option value="single">Single</option>
                  <option value="married">Married</option>
                  <option value="divorced">Divorced</option>
                  <option value="widowed">Widowed</option>
                </Select>
              </Field>
            </div>
          )}

          {/* Contact */}
          {activeSection === 1 && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Phone *">
                <Input reg={register('phone', { required: 'Required' })} placeholder="+91 XXXXX XXXXX" />
              </Field>
              <Field label="Email">
                <Input reg={register('email')} type="email" placeholder="patient@email.com" />
              </Field>
              <Field label="Address" error="">
                <textarea {...register('address')} rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none col-span-2"
                  placeholder="Door No, Street, Area" />
              </Field>
              <Field label="City">
                <Input reg={register('city')} placeholder="City" />
              </Field>
              <Field label="State">
                <Input reg={register('state')} placeholder="State" />
              </Field>
              <Field label="Pincode">
                <Input reg={register('pincode')} placeholder="600001" />
              </Field>
              <Field label="Country">
                <Input reg={register('country')} placeholder="India" defaultValue="India" />
              </Field>
            </div>
          )}

          {/* Emergency */}
          {activeSection === 2 && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Emergency Contact Name">
                <Input reg={register('emergency_contact_name')} placeholder="Full name" />
              </Field>
              <Field label="Emergency Contact Phone">
                <Input reg={register('emergency_contact_phone')} placeholder="+91 XXXXX XXXXX" />
              </Field>
              <Field label="Relation">
                <Select reg={register('emergency_contact_relation')}>
                  <option value="">Select</option>
                  {['Spouse','Parent','Sibling','Child','Friend','Other'].map(r => (
                    <option key={r} value={r.toLowerCase()}>{r}</option>
                  ))}
                </Select>
              </Field>
            </div>
          )}

          {/* Medical */}
          {activeSection === 3 && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Height (cm)">
                <Input reg={register('height_cm')} type="number" placeholder="170" />
              </Field>
              <Field label="Weight (kg)">
                <Input reg={register('weight_kg')} type="number" placeholder="65" />
              </Field>
              <div className="col-span-2">
                <Field label="Known Allergies">
                  <textarea {...register('allergies')} rows={2}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Penicillin, Sulpha drugs..." />
                </Field>
              </div>
              <div className="col-span-2">
                <Field label="Chronic Conditions">
                  <textarea {...register('chronic_conditions')} rows={2}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Diabetes, Hypertension..." />
                </Field>
              </div>
              <div className="col-span-2">
                <Field label="Current Medications">
                  <textarea {...register('current_medications')} rows={2}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Metformin 500mg, Amlodipine 5mg..." />
                </Field>
              </div>
              <Field label="Aadhar Number">
                <Input reg={register('aadhar_number')} placeholder="XXXX XXXX XXXX" maxLength={12} />
              </Field>
            </div>
          )}

          {/* Insurance */}
          {activeSection === 4 && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Insurance Provider">
                <Input reg={register('insurance_provider')} placeholder="Star Health, Niva Bupa..." />
              </Field>
              <Field label="Policy Number">
                <Input reg={register('insurance_policy_number')} placeholder="Policy number" />
              </Field>
              <Field label="Validity Date">
                <Input reg={register('insurance_validity')} type="date" />
              </Field>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-4">
          <button type="button" onClick={() => setActiveSection(p => Math.max(0, p - 1))}
            disabled={activeSection === 0}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition">
            Previous
          </button>
          {activeSection < SECTIONS.length - 1 ? (
            <button type="button" onClick={() => setActiveSection(p => p + 1)}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              Next
            </button>
          ) : (
            <button type="submit" disabled={loading}
              className="flex items-center gap-2 px-5 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60 transition">
              <Save size={16} />
              {loading ? 'Registering...' : 'Register Patient'}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

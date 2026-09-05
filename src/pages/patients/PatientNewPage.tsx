import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import CustomSelect from '../../components/ui/CustomSelect'
import { useMutation } from '@tanstack/react-query'
import { patientService } from '../../services/api'
import { ArrowLeft, User, Phone, MapPin, Heart } from 'lucide-react'
import toast from 'react-hot-toast'
import { cleanPayload } from '../../utils/form'

function FormSection({ title, icon: Icon, children }: any) {
  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid #F3F0FF' }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={15} color="#7C3AED" />
        </div>
        <p style={{ fontWeight: 700, fontSize: 14, color: '#1E1B4B' }}>{title}</p>
      </div>
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#4C1D95', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  )
}

export default function PatientNewPage() {
  const navigate = useNavigate()
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm()

  const create = useMutation({
    mutationFn: (data: any) => patientService.create(cleanPayload(data)),
    onSuccess: (res) => {
      toast.success('Patient registered successfully!')
      navigate(`/patients/${res.data.id}`)
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Registration failed')
  })

  return (
    <div style={{ maxWidth: 1100 }}>
      <button onClick={() => navigate('/patients')}
        style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#8B5CF6', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 20 }}>
        <ArrowLeft size={16} /> Back to Patients
      </button>

      <div style={{ marginBottom: 24 }}>
        <h1 className="page-title">Register New Patient</h1>
        <p className="page-subtitle">Fill in patient details to register</p>
      </div>

      <form onSubmit={handleSubmit(d => create.mutate(d))}>
        <FormSection title="Personal Information" icon={User}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="First Name *">
              <input {...register('first_name', { required: true })} className="input" placeholder="Rohan" />
            </Field>
            <Field label="Last Name *">
              <input {...register('last_name', { required: true })} className="input" placeholder="Mehta" />
            </Field>
            <Field label="Date of Birth *">
              <input type="date" {...register('date_of_birth', { required: true })} className="input" />
              {errors.date_of_birth && <p style={{ color: '#DC2626', fontSize: 12, marginTop: 4 }}>Date of birth is required</p>}
            </Field>
            <Field label="Gender *">
              <input type="hidden" {...register('gender', { required: true })} />
              <CustomSelect value={watch('gender') || ''} onChange={v => setValue('gender', String(v), { shouldValidate: true })} placeholder="Select gender"
                options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'other', label: 'Other' }]} />
              {errors.gender && <p style={{ color: '#DC2626', fontSize: 12, marginTop: 4 }}>Gender is required</p>}
            </Field>
            <Field label="Blood Group">
              <CustomSelect value={watch('blood_group') || ''} onChange={v => setValue('blood_group', String(v))} placeholder="Select blood group"
                options={['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(b => ({ value: b, label: b }))} />
            </Field>
            <Field label="Marital Status">
              <CustomSelect value={watch('marital_status') || ''} onChange={v => setValue('marital_status', String(v))} placeholder="Select status"
                options={[{ value: 'single', label: 'Single' }, { value: 'married', label: 'Married' }, { value: 'divorced', label: 'Divorced' }, { value: 'widowed', label: 'Widowed' }]} />
            </Field>
          </div>
        </FormSection>

        <FormSection title="Contact Information" icon={Phone}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="Phone *">
              <input {...register('phone', { required: true })} className="input" placeholder="9876543210" />
            </Field>
            <Field label="Email">
              <input type="email" {...register('email')} className="input" placeholder="patient@email.com" />
            </Field>
            <Field label="Address">
              <input {...register('address')} className="input" placeholder="Street, City" />
            </Field>
            <Field label="City">
              <input {...register('city')} className="input" placeholder="Mumbai" />
            </Field>
            <Field label="Emergency Contact Name">
              <input {...register('emergency_contact_name')} className="input" placeholder="John Doe" />
            </Field>
            <Field label="Emergency Contact Phone">
              <input {...register('emergency_contact_phone')} className="input" placeholder="9876543210" />
            </Field>
          </div>
        </FormSection>

        <FormSection title="Medical Information" icon={Heart}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="Known Allergies">
              <input {...register('allergies')} className="input" placeholder="Penicillin, Peanuts..." />
            </Field>
            <Field label="Chronic Diseases">
              <input {...register('chronic_conditions')} className="input" placeholder="Diabetes, Hypertension..." />
            </Field>
            <Field label="Insurance Provider">
              <input {...register('insurance_provider')} className="input" placeholder="Star Health, HDFC ERGO..." />
            </Field>
            <Field label="Policy Number">
              <input {...register('insurance_policy_number')} className="input" placeholder="POL-XXXX-XXXX" />
            </Field>
          </div>
        </FormSection>

        <div style={{ display: 'flex', gap: 10 }}>
          <button type="submit" className="btn-primary" disabled={create.isPending}>
            {create.isPending ? 'Registering...' : 'Register Patient'}
          </button>
          <button type="button" className="btn-secondary" onClick={() => navigate('/patients')}>Cancel</button>
        </div>
      </form>
    </div>
  )
}

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { patientDataService } from '../../services/patientApi'
import { Star } from 'lucide-react'
import toast from 'react-hot-toast'

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none"

export default function PatientFeedbackPage() {
  const qc = useQueryClient()
  const [rating, setRating] = useState(5)
  const [comments, setComments] = useState('')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')

  const { data: grievances } = useQuery({ queryKey: ['pw-grievances'], queryFn: () => patientDataService.myGrievances().then(r => r.data) })

  const submitFeedback = useMutation({
    mutationFn: () => patientDataService.submitFeedback({ rating, comments }),
    onSuccess: () => { setComments(''); setRating(5); toast.success('Thank you for your feedback!') },
  })
  const submitGrievance = useMutation({
    mutationFn: () => patientDataService.submitGrievance({ subject, description }),
    onSuccess: () => { setSubject(''); setDescription(''); qc.invalidateQueries({ queryKey: ['pw-grievances'] }); toast.success('Grievance submitted') },
  })

  const statusColor = (s: string) => s === 'resolved' ? '#059669' : s === 'open' ? '#DC2626' : '#7C3AED'

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 16 }}>Feedback & Grievances</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Rate your experience</h3>
          <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
            {[1, 2, 3, 4, 5].map(i => (
              <button key={i} onClick={() => setRating(i)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <Star size={28} fill={i <= rating ? '#F59E0B' : 'none'} color="#F59E0B" />
              </button>
            ))}
          </div>
          <textarea value={comments} onChange={e => setComments(e.target.value)} className={inputCls} rows={3} placeholder="Comments (optional)" style={{ marginBottom: 12 }} />
          <button className="btn-primary" onClick={() => submitFeedback.mutate()}>Submit feedback</button>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Raise a grievance</h3>
          <input value={subject} onChange={e => setSubject(e.target.value)} className={inputCls} placeholder="Subject" style={{ marginBottom: 10 }} />
          <textarea value={description} onChange={e => setDescription(e.target.value)} className={inputCls} rows={3} placeholder="Description" style={{ marginBottom: 12 }} />
          <button className="btn-primary" onClick={() => submitGrievance.mutate()} disabled={!subject || !description}>Submit grievance</button>

          <div style={{ marginTop: 20 }}>
            {grievances?.map((g: any) => (
              <div key={g.id} style={{ padding: '10px 0', borderTop: '1px solid #F3F4F6' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{g.subject}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: statusColor(g.status) }}>{g.status.toUpperCase()}</span>
                </div>
                {g.resolution_notes && <p style={{ fontSize: 12, color: '#059669', margin: '4px 0 0' }}>Resolution: {g.resolution_notes}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

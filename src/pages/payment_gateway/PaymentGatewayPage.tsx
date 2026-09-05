import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { paymentGatewayService } from '../../services/api'
import { CreditCard, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { cleanPayload } from '../../utils/form'

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none"

export default function PaymentGatewayPage() {
  const [billId, setBillId] = useState('')
  const form = useForm<any>({ defaultValues: { gateway_name: 'manual', currency: 'INR' } })

  const { data: transactions } = useQuery({
    queryKey: ['gateway-txns', billId], queryFn: () => paymentGatewayService.listForBill(parseInt(billId)).then(r => r.data), enabled: !!billId,
  })

  const initiate = useMutation({
    mutationFn: (d: any) => paymentGatewayService.initiate(cleanPayload({ ...d, bill_id: parseInt(billId), patient_id: parseInt(d.patient_id), amount: parseFloat(d.amount) })),
    onSuccess: () => toast.success('Payment session created'),
    onError: (e: any) => {
      if (e.response?.status === 501) {
        toast.error('No real payment gateway is configured — see backend services/payment_gateway.py to register one')
      } else {
        toast.error(e.response?.data?.detail || 'Failed to initiate payment')
      }
    },
  })

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 4 }}>Payment Gateway</h1>
      <p style={{ color: '#8B5CF6', fontSize: 13, marginBottom: 6 }}>Vendor-agnostic online payment plumbing</p>
      <p style={{ color: '#D97706', fontSize: 11, marginBottom: 20 }}>
        ⚠ No real gateway (Razorpay/Stripe/PayU/etc) is wired by default — moving real money always needs a real merchant account,
        unlike Telemedicine's free Jitsi default. This page exercises the interface; "Initiate" will return a clear 501 until a real
        gateway adapter is registered in the backend.
      </p>

      <input value={billId} onChange={e => setBillId(e.target.value)} className={inputCls} style={{ maxWidth: 300, marginBottom: 20 }} placeholder="Bill ID" />

      {billId && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 20 }}>
          <div className="card" style={{ padding: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}><Plus size={14} style={{ marginRight: 6, display: 'inline' }} />Initiate Payment</h3>
            <form onSubmit={form.handleSubmit(d => initiate.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input {...form.register('patient_id', { required: true })} className={inputCls} placeholder="Patient ID" />
              <input {...form.register('amount', { required: true })} className={inputCls} placeholder="Amount" />
              <select {...form.register('gateway_name')} className={inputCls}>
                <option value="manual">manual (placeholder — not implemented)</option>
              </select>
              <button type="submit" className="btn-primary">Initiate</button>
            </form>
          </div>

          <div className="card" style={{ padding: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}><CreditCard size={14} style={{ marginRight: 6, display: 'inline' }} />Transactions for this Bill</h3>
            {transactions?.length === 0 && <p style={{ color: '#9CA3AF', fontSize: 12 }}>No transactions yet.</p>}
            {transactions?.map((t: any) => (
              <div key={t.id} style={{ padding: 8, borderBottom: '1px solid #F3F4F6', fontSize: 12 }}>
                {t.gateway_name} — {t.currency} {t.amount} — <span style={{ color: t.status === 'success' ? '#059669' : t.status === 'failed' ? '#DC2626' : '#8B5CF6' }}>{t.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

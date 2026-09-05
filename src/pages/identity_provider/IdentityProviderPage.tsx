import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { identityProviderService } from '../../services/api'
import { KeyRound, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { cleanPayload } from '../../utils/form'

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none"

export default function IdentityProviderPage() {
  const qc = useQueryClient()
  const form = useForm<any>({ defaultValues: { scopes: 'openid profile email' } })
  const { data: providers } = useQuery({ queryKey: ['oidc-providers'], queryFn: () => identityProviderService.list().then(r => r.data) })

  const create = useMutation({
    mutationFn: (d: any) => identityProviderService.create(cleanPayload(d)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['oidc-providers'] }); form.reset({ scopes: 'openid profile email' }); toast.success('SSO provider configured') },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Admin role required'),
  })

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 4 }}>Identity Provider (SSO)</h1>
      <p style={{ color: '#8B5CF6', fontSize: 13, marginBottom: 6 }}>Generic OpenID Connect client — works with any standards-compliant IdP</p>
      <p style={{ color: '#9CA3AF', fontSize: 11, marginBottom: 20 }}>SSO only covers login for staff accounts that already exist — it never auto-creates new accounts from an external identity provider.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 20 }}>
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}><Plus size={14} style={{ marginRight: 6, display: 'inline' }} />Add SSO Provider (admin)</h3>
          <form onSubmit={form.handleSubmit(d => create.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input {...form.register('provider_name', { required: true })} className={inputCls} placeholder="Display name (e.g. Hospital Group SSO)" />
            <input {...form.register('issuer', { required: true })} className={inputCls} placeholder="Issuer URL" />
            <input {...form.register('client_id', { required: true })} className={inputCls} placeholder="Client ID" />
            <input {...form.register('client_secret', { required: true })} type="password" className={inputCls} placeholder="Client secret" />
            <input {...form.register('authorization_endpoint', { required: true })} className={inputCls} placeholder="Authorization endpoint" />
            <input {...form.register('token_endpoint', { required: true })} className={inputCls} placeholder="Token endpoint" />
            <input {...form.register('userinfo_endpoint')} className={inputCls} placeholder="Userinfo endpoint" />
            <input {...form.register('redirect_uri', { required: true })} className={inputCls} placeholder="Redirect URI (this app's callback)" />
            <button type="submit" className="btn-primary">Save Provider</button>
          </form>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}><KeyRound size={14} style={{ marginRight: 6, display: 'inline' }} />Configured Providers</h3>
          {providers?.length === 0 && <p style={{ color: '#9CA3AF', fontSize: 12 }}>No SSO providers configured yet.</p>}
          {providers?.map((p: any) => (
            <div key={p.id} style={{ padding: 10, borderBottom: '1px solid #F3F4F6', fontSize: 12 }}>
              <span style={{ fontWeight: 600 }}>{p.provider_name}</span>
              <span style={{ color: '#9CA3AF', marginLeft: 8 }}>{p.issuer}</span>
              <div style={{ fontSize: 11, color: '#7C3AED', marginTop: 4 }}>Login URL: /api/identity-provider/{p.id}/login</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, useFieldArray } from 'react-hook-form'
import { accountsService } from '../../services/api'
import { Wallet, BookOpen, TrendingUp, FileBarChart, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { cleanPayload } from '../../utils/form'
import CustomSelect from '../../components/ui/CustomSelect'

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none"
const TABS = ['Dashboard', 'Chart of Accounts', 'Quick Entry', 'Journal', 'Reports']

export default function AccountsPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState(0)
  const [showAccountForm, setShowAccountForm] = useState(false)
  const [quickMode, setQuickMode] = useState<'expense' | 'income'>('expense')
  const [reportTab, setReportTab] = useState(0)

  const accountForm = useForm<any>({ defaultValues: { account_type: 'expense' } })
  const quickForm = useForm<any>()
  const journalForm = useForm<any>({ defaultValues: { lines: [{ account_id: '', debit: 0, credit: 0 }, { account_id: '', debit: 0, credit: 0 }] } })
  const { fields, append, remove } = useFieldArray({ control: journalForm.control, name: 'lines' })

  const { data: dashboard } = useQuery({
    queryKey: ['acc-dashboard'],
    queryFn: () => accountsService.getDashboard().then(r => r.data),
    refetchInterval: 30000,
  })
  const { data: accounts } = useQuery({
    queryKey: ['acc-chart'],
    queryFn: () => accountsService.listAccounts().then(r => r.data),
  })
  const { data: journalEntries } = useQuery({
    queryKey: ['acc-journal'],
    queryFn: () => accountsService.listJournalEntries().then(r => r.data),
    enabled: tab === 3,
  })
  const { data: trialBalance } = useQuery({
    queryKey: ['acc-tb'],
    queryFn: () => accountsService.getTrialBalance().then(r => r.data),
    enabled: tab === 4 && reportTab === 0,
  })
  const { data: profitLoss } = useQuery({
    queryKey: ['acc-pl'],
    queryFn: () => accountsService.getProfitLoss().then(r => r.data),
    enabled: tab === 4 && reportTab === 1,
  })
  const { data: balanceSheet } = useQuery({
    queryKey: ['acc-bs'],
    queryFn: () => accountsService.getBalanceSheet().then(r => r.data),
    enabled: tab === 4 && reportTab === 2,
  })

  const cashBankAccounts = accounts?.filter((a: any) => a.is_cash || a.is_bank) || []
  const expenseAccounts = accounts?.filter((a: any) => a.account_type === 'expense') || []
  const incomeAccounts = accounts?.filter((a: any) => a.account_type === 'income') || []

  const createAccount = useMutation({
    mutationFn: (d: any) => accountsService.createAccount(cleanPayload(d)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['acc-chart', 'acc-dashboard'] })
      accountForm.reset({ account_type: 'expense' })
      setShowAccountForm(false)
      toast.success('Account created')
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Failed to create account'),
  })

  const quickEntry = useMutation({
    mutationFn: (d: any) => {
      const payload = quickMode === 'expense'
        ? { expense_account_id: parseInt(d.category_account_id), payment_account_id: parseInt(d.cash_bank_account_id), amount: parseFloat(d.amount), narration: d.narration }
        : { income_account_id: parseInt(d.category_account_id), receipt_account_id: parseInt(d.cash_bank_account_id), amount: parseFloat(d.amount), narration: d.narration }
      return quickMode === 'expense' ? accountsService.quickExpense(payload) : accountsService.quickIncome(payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['acc-dashboard', 'acc-journal'] })
      quickForm.reset()
      toast.success(`${quickMode === 'expense' ? 'Expense' : 'Income'} recorded`)
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Failed to record entry'),
  })

  const createJournalEntry = useMutation({
    mutationFn: (d: any) => accountsService.createJournalEntry(cleanPayload({
      ...d,
      lines: d.lines.map((l: any) => ({ account_id: parseInt(l.account_id), debit: parseFloat(l.debit) || 0, credit: parseFloat(l.credit) || 0 })),
    })),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['acc-journal', 'acc-dashboard'] })
      journalForm.reset({ lines: [{ account_id: '', debit: 0, credit: 0 }, { account_id: '', debit: 0, credit: 0 }] })
      toast.success('Journal entry posted')
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Failed to post entry'),
  })

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 className="page-title">Accounts</h1>
        <p style={{ color: '#8B5CF6', fontSize: 13 }}>Chart of Accounts · Journal · Ledger · Financial Reports</p>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid #F3F0FF', flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{ padding: '8px 18px', fontSize: 13, fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer', marginBottom: -2, borderBottom: tab === i ? '2px solid #7C3AED' : '2px solid transparent', color: tab === i ? '#7C3AED' : '#9CA3AF' }}>
            {t}
          </button>
        ))}
      </div>

      {/* DASHBOARD */}
      {tab === 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
          {[
            { label: 'Total Accounts', value: dashboard?.total_accounts ?? 0, icon: BookOpen, color: '#7C3AED', bg: '#F5F3FF' },
            { label: 'Journal Entries', value: dashboard?.total_journal_entries ?? 0, icon: FileBarChart, color: '#1D4ED8', bg: '#EFF6FF' },
            { label: 'Entries Today', value: dashboard?.entries_today ?? 0, icon: Wallet, color: '#D97706', bg: '#FFFBEB' },
            { label: 'Net Profit (All Time)', value: `₹${(dashboard?.net_profit_all_time ?? 0).toLocaleString()}`, icon: TrendingUp, color: (dashboard?.net_profit_all_time ?? 0) >= 0 ? '#15803D' : '#DC2626', bg: (dashboard?.net_profit_all_time ?? 0) >= 0 ? '#F0FDF4' : '#FEF2F2' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={17} color={color} />
                </div>
                <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>{label}</span>
              </div>
              <p style={{ fontSize: 22, fontWeight: 700, color: '#1E1B4B' }}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* CHART OF ACCOUNTS */}
      {tab === 1 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button className="btn-primary" onClick={() => setShowAccountForm(true)}>
              <Plus size={14} style={{ marginRight: 6 }} /> Add Account
            </button>
          </div>

          {showAccountForm && (
            <div className="card" style={{ maxWidth: 480, padding: 20, marginBottom: 20 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1E1B4B', marginBottom: 16 }}>Add Account</h2>
              <form onSubmit={accountForm.handleSubmit(d => createAccount.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input {...accountForm.register('account_code', { required: true })} className={inputCls} placeholder="Account Code (e.g. 1000)" />
                <input {...accountForm.register('name', { required: true })} className={inputCls} placeholder="Account Name" />
                <CustomSelect value={accountForm.watch('account_type') || 'expense'} onChange={v => accountForm.setValue('account_type', String(v))}
                  options={[{ value: 'asset', label: 'Asset' }, { value: 'liability', label: 'Liability' }, { value: 'equity', label: 'Equity' }, { value: 'income', label: 'Income' }, { value: 'expense', label: 'Expense' }]} />
                <div style={{ display: 'flex', gap: 16 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#4C1D95' }}>
                    <input type="checkbox" {...accountForm.register('is_cash')} /> Cash account
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#4C1D95' }}>
                    <input type="checkbox" {...accountForm.register('is_bank')} /> Bank account
                  </label>
                </div>
                <input {...accountForm.register('opening_balance')} type="number" step="0.01" className={inputCls} placeholder="Opening Balance" />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="submit" disabled={createAccount.isPending} className="btn-primary">
                    {createAccount.isPending ? 'Adding...' : 'Add Account'}
                  </button>
                  <button type="button" className="btn-ghost" onClick={() => setShowAccountForm(false)}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="w-full">
              <thead>
                <tr style={{ background: '#FAF5FF' }}>
                  <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Code</th>
                  <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Name</th>
                  <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Type</th>
                  <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Opening Bal.</th>
                </tr>
              </thead>
              <tbody>
                {accounts?.map((a: any) => (
                  <tr key={a.id} style={{ borderTop: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, color: '#1E1B4B' }}>{a.account_code}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13, color: '#374151' }}>{a.name} {a.is_cash && <span style={{ fontSize: 10, color: '#7C3AED' }}>(Cash)</span>} {a.is_bank && <span style={{ fontSize: 10, color: '#1D4ED8' }}>(Bank)</span>}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13, color: '#374151', textTransform: 'capitalize' }}>{a.account_type}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13, color: '#374151' }}>₹{a.opening_balance.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* QUICK ENTRY */}
      {tab === 2 && (
        <div className="card" style={{ maxWidth: 480, padding: 20 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button onClick={() => setQuickMode('expense')} style={{ flex: 1, padding: '8px', borderRadius: 8, border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', background: quickMode === 'expense' ? '#FEF2F2' : '#F3F4F6', color: quickMode === 'expense' ? '#DC2626' : '#6B7280' }}>
              Record Expense
            </button>
            <button onClick={() => setQuickMode('income')} style={{ flex: 1, padding: '8px', borderRadius: 8, border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', background: quickMode === 'income' ? '#F0FDF4' : '#F3F4F6', color: quickMode === 'income' ? '#15803D' : '#6B7280' }}>
              Record Income
            </button>
          </div>
          <form onSubmit={quickForm.handleSubmit(d => quickEntry.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4C1D95', marginBottom: 4 }}>{quickMode === 'expense' ? 'Expense Category' : 'Income Category'} *</label>
              <select {...quickForm.register('category_account_id', { required: true })} className={inputCls}>
                <option value="">— Select —</option>
                {(quickMode === 'expense' ? expenseAccounts : incomeAccounts).map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4C1D95', marginBottom: 4 }}>{quickMode === 'expense' ? 'Paid From' : 'Received Into'} *</label>
              <select {...quickForm.register('cash_bank_account_id', { required: true })} className={inputCls}>
                <option value="">— Select cash/bank account —</option>
                {cashBankAccounts.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <input {...quickForm.register('amount', { required: true })} type="number" step="0.01" className={inputCls} placeholder="Amount" />
            <input {...quickForm.register('narration', { required: true })} className={inputCls} placeholder="What was this for?" />
            <button type="submit" disabled={quickEntry.isPending} className="btn-primary">
              {quickEntry.isPending ? 'Saving...' : `Record ${quickMode === 'expense' ? 'Expense' : 'Income'}`}
            </button>
          </form>
        </div>
      )}

      {/* JOURNAL */}
      {tab === 3 && (
        <div>
          <div className="card" style={{ maxWidth: 640, padding: 20, marginBottom: 20 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1E1B4B', marginBottom: 16 }}>New Journal Entry</h2>
            <form onSubmit={journalForm.handleSubmit(d => createJournalEntry.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input {...journalForm.register('narration', { required: true })} className={inputCls} placeholder="Narration" />
              <input {...journalForm.register('reference')} className={inputCls} placeholder="Reference (optional)" />

              {fields.map((field, idx) => (
                <div key={field.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 8, alignItems: 'center' }}>
                  <select {...journalForm.register(`lines.${idx}.account_id`, { required: true })} className={inputCls}>
                    <option value="">— Account —</option>
                    {accounts?.map((a: any) => <option key={a.id} value={a.id}>{a.account_code} - {a.name}</option>)}
                  </select>
                  <input {...journalForm.register(`lines.${idx}.debit`)} type="number" step="0.01" className={inputCls} placeholder="Debit" />
                  <input {...journalForm.register(`lines.${idx}.credit`)} type="number" step="0.01" className={inputCls} placeholder="Credit" />
                  {fields.length > 2 && <button type="button" onClick={() => remove(idx)}><Trash2 size={14} color="#DC2626" /></button>}
                </div>
              ))}
              <button type="button" className="btn-ghost" style={{ fontSize: 12, alignSelf: 'flex-start' }} onClick={() => append({ account_id: '', debit: 0, credit: 0 })}>
                <Plus size={12} style={{ marginRight: 4, display: 'inline' }} />Add Line
              </button>
              <p style={{ fontSize: 11, color: '#9CA3AF' }}>Total debits must equal total credits.</p>
              <button type="submit" disabled={createJournalEntry.isPending} className="btn-primary">
                {createJournalEntry.isPending ? 'Posting...' : 'Post Entry'}
              </button>
            </form>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="w-full">
              <thead>
                <tr style={{ background: '#FAF5FF' }}>
                  <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Entry #</th>
                  <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Date</th>
                  <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Narration</th>
                  <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {journalEntries?.map((e: any) => (
                  <tr key={e.id} style={{ borderTop: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, color: '#1E1B4B' }}>{e.entry_number}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#6B7280' }}>{format(new Date(e.entry_date), 'dd MMM yyyy')}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13, color: '#374151' }}>{e.narration}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13, color: '#374151' }}>₹{e.lines.reduce((s: number, l: any) => s + l.debit, 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORTS */}
      {tab === 4 && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {['Trial Balance', 'Profit & Loss', 'Balance Sheet'].map((t, i) => (
              <button key={t} onClick={() => setReportTab(i)} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', background: reportTab === i ? '#7C3AED' : '#F3F4F6', color: reportTab === i ? 'white' : '#6B7280' }}>
                {t}
              </button>
            ))}
          </div>

          {reportTab === 0 && trialBalance && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: 14, background: trialBalance.is_balanced ? '#F0FDF4' : '#FEF2F2', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: trialBalance.is_balanced ? '#15803D' : '#DC2626' }}>
                  {trialBalance.is_balanced ? '✓ Balanced' : '✗ Not Balanced'}
                </span>
                <span style={{ fontSize: 13, color: '#374151' }}>Debits: ₹{trialBalance.total_debits.toLocaleString()} · Credits: ₹{trialBalance.total_credits.toLocaleString()}</span>
              </div>
              <table className="w-full">
                <thead>
                  <tr style={{ background: '#FAF5FF' }}>
                    <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Account</th>
                    <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Type</th>
                    <th style={{ textAlign: 'right', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Debit</th>
                    <th style={{ textAlign: 'right', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Credit</th>
                    <th style={{ textAlign: 'right', padding: '10px 14px', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {trialBalance.rows.map((r: any) => (
                    <tr key={r.account_id} style={{ borderTop: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '8px 14px', fontSize: 12, color: '#1E1B4B' }}>{r.account_code} - {r.account_name}</td>
                      <td style={{ padding: '8px 14px', fontSize: 12, color: '#6B7280', textTransform: 'capitalize' }}>{r.account_type}</td>
                      <td style={{ padding: '8px 14px', fontSize: 12, textAlign: 'right' }}>₹{r.debit_total.toLocaleString()}</td>
                      <td style={{ padding: '8px 14px', fontSize: 12, textAlign: 'right' }}>₹{r.credit_total.toLocaleString()}</td>
                      <td style={{ padding: '8px 14px', fontSize: 12, textAlign: 'right', fontWeight: 700 }}>₹{r.balance.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {reportTab === 1 && profitLoss && (
            <div className="card" style={{ padding: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div><p style={{ fontSize: 11, color: '#6B7280' }}>Income</p><p style={{ fontSize: 20, fontWeight: 700, color: '#15803D' }}>₹{profitLoss.income_total.toLocaleString()}</p></div>
                <div><p style={{ fontSize: 11, color: '#6B7280' }}>Expenses</p><p style={{ fontSize: 20, fontWeight: 700, color: '#DC2626' }}>₹{profitLoss.expense_total.toLocaleString()}</p></div>
                <div><p style={{ fontSize: 11, color: '#6B7280' }}>Net Profit</p><p style={{ fontSize: 20, fontWeight: 700, color: profitLoss.net_profit >= 0 ? '#15803D' : '#DC2626' }}>₹{profitLoss.net_profit.toLocaleString()}</p></div>
              </div>
              <h4 style={{ fontSize: 12, fontWeight: 700, color: '#15803D', marginBottom: 8 }}>Income Breakdown</h4>
              {profitLoss.income_breakdown.map((r: any) => (
                <div key={r.account_id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0' }}>
                  <span>{r.account_name}</span><span>₹{r.balance.toLocaleString()}</span>
                </div>
              ))}
              <h4 style={{ fontSize: 12, fontWeight: 700, color: '#DC2626', margin: '16px 0 8px' }}>Expense Breakdown</h4>
              {profitLoss.expense_breakdown.map((r: any) => (
                <div key={r.account_id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0' }}>
                  <span>{r.account_name}</span><span>₹{r.balance.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}

          {reportTab === 2 && balanceSheet && (
            <div className="card" style={{ padding: 20 }}>
              <div style={{ marginBottom: 12, padding: 10, borderRadius: 8, background: balanceSheet.is_balanced ? '#F0FDF4' : '#FEF2F2' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: balanceSheet.is_balanced ? '#15803D' : '#DC2626' }}>
                  {balanceSheet.is_balanced ? '✓ Balanced' : '✗ Not Balanced'}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div>
                  <h4 style={{ fontSize: 12, fontWeight: 700, color: '#1E1B4B', marginBottom: 8 }}>Assets — ₹{balanceSheet.asset_total.toLocaleString()}</h4>
                  {balanceSheet.assets.map((r: any) => (
                    <div key={r.account_id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0' }}>
                      <span>{r.account_name}</span><span>₹{r.balance.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <h4 style={{ fontSize: 12, fontWeight: 700, color: '#1E1B4B', marginBottom: 8 }}>Liabilities — ₹{balanceSheet.liability_total.toLocaleString()}</h4>
                  {balanceSheet.liabilities.map((r: any) => (
                    <div key={r.account_id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0' }}>
                      <span>{r.account_name}</span><span>₹{r.balance.toLocaleString()}</span>
                    </div>
                  ))}
                  <h4 style={{ fontSize: 12, fontWeight: 700, color: '#1E1B4B', margin: '16px 0 8px' }}>Equity — ₹{balanceSheet.equity_total.toLocaleString()}</h4>
                  {balanceSheet.equity.map((r: any) => (
                    <div key={r.account_id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0' }}>
                      <span>{r.account_name}</span><span>₹{r.balance.toLocaleString()}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', fontWeight: 700, borderTop: '1px solid #F3F4F6', marginTop: 8, paddingTop: 8 }}>
                    <span>Retained Earnings</span><span>₹{balanceSheet.retained_earnings.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

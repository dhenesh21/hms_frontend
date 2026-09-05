/**
 * HMS Print Utility
 * Uses window.print() with a dedicated print stylesheet.
 * No external PDF library needed — works cross-browser.
 */

const HOSPITAL_NAME = localStorage.getItem('setting_hospital_name') || 'HMS Hospital'
const HOSPITAL_ADDRESS = localStorage.getItem('setting_hospital_address') || ''
const HOSPITAL_PHONE = localStorage.getItem('setting_hospital_phone') || ''
const HOSPITAL_GST = localStorage.getItem('setting_hospital_gst_number') || ''

function printHTML(html: string, title: string) {
  const win = window.open('', '_blank', 'width=800,height=600')
  if (!win) return
  win.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 12px; color: #000; padding: 20px; }
        .header { text-align: center; border-bottom: 2px solid #6D28D9; padding-bottom: 10px; margin-bottom: 16px; }
        .header h1 { font-size: 20px; color: #6D28D9; }
        .header p { font-size: 11px; color: #555; margin-top: 2px; }
        .title { font-size: 15px; font-weight: bold; text-align: center; margin-bottom: 14px; color: #4C1D95; text-transform: uppercase; letter-spacing: 1px; border: 1px solid #DDD6FE; padding: 6px; background: #F5F3FF; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px; }
        .field { margin-bottom: 6px; }
        .field label { font-size: 10px; color: #777; text-transform: uppercase; display: block; }
        .field span { font-size: 12px; font-weight: 600; }
        table { width: 100%; border-collapse: collapse; margin: 12px 0; }
        th { background: #F5F3FF; color: #4C1D95; font-size: 11px; padding: 6px 8px; text-align: left; border: 1px solid #DDD6FE; }
        td { padding: 6px 8px; border: 1px solid #E5E7EB; font-size: 12px; }
        .section-title { font-size: 13px; font-weight: bold; color: #4C1D95; margin: 14px 0 8px; border-bottom: 1px solid #EDE9FE; padding-bottom: 4px; }
        .total { text-align: right; font-size: 14px; font-weight: bold; margin-top: 8px; }
        .footer { margin-top: 24px; border-top: 1px solid #DDD6FE; padding-top: 10px; display: grid; grid-template-columns: 1fr 1fr; }
        .signature { text-align: center; }
        .sig-line { border-top: 1px solid #000; width: 120px; margin: 20px auto 4px; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 600; }
        .badge-green { background: #ECFDF5; color: #059669; }
        .badge-yellow { background: #FFFBEB; color: #D97706; }
        @media print { body { padding: 10px; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${HOSPITAL_NAME}</h1>
        <p>${HOSPITAL_ADDRESS}${HOSPITAL_PHONE ? ' · ' + HOSPITAL_PHONE : ''}${HOSPITAL_GST ? ' · GST: ' + HOSPITAL_GST : ''}</p>
      </div>
      ${html}
      <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); }<\/script>
    </body>
    </html>
  `)
  win.document.close()
}


// ─── PRESCRIPTION PRINT ────────────────────────────────────────
export function printPrescription(visit: any) {
  const drugs = visit.prescriptions || []
  const drugRows = drugs.length > 0
    ? drugs.map((d: any) => `
      <tr>
        <td>${d.drug_name || '—'}</td>
        <td>${d.dosage || '—'}</td>
        <td>${d.frequency || '—'}</td>
        <td>${d.duration_days || '—'} days</td>
        <td>${d.route || 'oral'}</td>
        <td>${d.instructions || ''}</td>
      </tr>`).join('')
    : '<tr><td colspan="6" style="text-align:center;color:#999">No prescriptions</td></tr>'

  const html = `
    <div class="title">Prescription</div>
    <div class="grid-2">
      <div>
        <div class="field"><label>Patient</label><span>${visit.patient_name || visit.patient?.first_name + ' ' + visit.patient?.last_name || '—'}</span></div>
        <div class="field"><label>UHID</label><span>${visit.patient_uhid || visit.patient?.uhid || '—'}</span></div>
        <div class="field"><label>Age / Gender</label><span>${visit.patient_age || '—'} / ${visit.patient_gender || '—'}</span></div>
      </div>
      <div>
        <div class="field"><label>Doctor</label><span>Dr. ${visit.doctor_name || '—'}</span></div>
        <div class="field"><label>Date</label><span>${visit.visit_date || new Date().toLocaleDateString('en-IN')}</span></div>
        <div class="field"><label>Visit No.</label><span>${visit.visit_number || visit.id || '—'}</span></div>
      </div>
    </div>

    ${visit.chief_complaint ? `<div class="field" style="margin-bottom:8px"><label>Chief Complaint</label><span>${visit.chief_complaint}</span></div>` : ''}
    ${visit.diagnosis ? `<div class="field" style="margin-bottom:8px"><label>Diagnosis</label><span>${visit.diagnosis}</span></div>` : ''}

    <div class="section-title">Rx — Medications</div>
    <table>
      <thead><tr><th>Drug</th><th>Dosage</th><th>Frequency</th><th>Duration</th><th>Route</th><th>Instructions</th></tr></thead>
      <tbody>${drugRows}</tbody>
    </table>

    ${visit.advice ? `<div class="section-title">Advice</div><p style="font-size:12px">${visit.advice}</p>` : ''}
    ${visit.follow_up_date ? `<p style="margin-top:8px;font-size:12px"><strong>Follow-up:</strong> ${visit.follow_up_date}</p>` : ''}

    <div class="footer">
      <div></div>
      <div class="signature">
        <div class="sig-line"></div>
        <p>Dr. ${visit.doctor_name || '—'}</p>
        <p style="font-size:10px;color:#777">${visit.doctor_specialization || ''}</p>
      </div>
    </div>
  `
  printHTML(html, `Prescription - ${visit.patient_name || visit.id}`)
}


// ─── BILL PRINT ────────────────────────────────────────────────
export function printBill(bill: any) {
  const items = bill.items || []
  const itemRows = items.map((item: any) => `
    <tr>
      <td>${item.item_name}</td>
      <td>${item.category || '—'}</td>
      <td style="text-align:right">${item.quantity || 1}</td>
      <td style="text-align:right">₹${Number(item.unit_price || 0).toFixed(2)}</td>
      <td style="text-align:right">${item.tax_percent || 0}%</td>
      <td style="text-align:right">₹${Number(item.total_amount || (item.unit_price * (item.quantity || 1))).toFixed(2)}</td>
    </tr>`).join('')

  const statusBadge = bill.payment_status === 'paid'
    ? '<span class="badge badge-green">PAID</span>'
    : '<span class="badge badge-yellow">PENDING</span>'

  const html = `
    <div class="title">Tax Invoice ${statusBadge}</div>
    <div class="grid-2">
      <div>
        <div class="field"><label>Bill Number</label><span>${bill.bill_number || '—'}</span></div>
        <div class="field"><label>Bill Date</label><span>${bill.bill_date ? new Date(bill.bill_date).toLocaleDateString('en-IN') : '—'}</span></div>
        <div class="field"><label>Bill Type</label><span style="text-transform:capitalize">${bill.bill_type || '—'}</span></div>
      </div>
      <div>
        <div class="field"><label>Patient</label><span>${bill.patient_name || '—'}</span></div>
        <div class="field"><label>UHID</label><span>${bill.patient_uhid || '—'}</span></div>
        <div class="field"><label>Payment Mode</label><span style="text-transform:capitalize">${bill.payment_mode || 'pending'}</span></div>
      </div>
    </div>

    <table>
      <thead><tr><th>Description</th><th>Category</th><th style="text-align:right">Qty</th><th style="text-align:right">Rate</th><th style="text-align:right">Tax</th><th style="text-align:right">Amount</th></tr></thead>
      <tbody>${itemRows}</tbody>
    </table>

    <div style="display:grid;grid-template-columns:1fr 200px;gap:16px">
      <div>
        ${bill.notes ? `<p style="font-size:11px;color:#777">Note: ${bill.notes}</p>` : ''}
        ${HOSPITAL_GST ? `<p style="font-size:11px;color:#777;margin-top:4px">GST: ${HOSPITAL_GST}</p>` : ''}
      </div>
      <div>
        <table style="width:100%">
          <tr><td>Subtotal</td><td style="text-align:right">₹${Number(bill.subtotal || 0).toFixed(2)}</td></tr>
          ${bill.discount_amount > 0 ? `<tr><td>Discount</td><td style="text-align:right">-₹${Number(bill.discount_amount).toFixed(2)}</td></tr>` : ''}
          ${bill.tax_amount > 0 ? `<tr><td>Tax</td><td style="text-align:right">₹${Number(bill.tax_amount).toFixed(2)}</td></tr>` : ''}
          <tr style="font-weight:bold;font-size:14px"><td>Total</td><td style="text-align:right">₹${Number(bill.total_amount || 0).toFixed(2)}</td></tr>
          ${bill.paid_amount > 0 ? `<tr style="color:#059669"><td>Paid</td><td style="text-align:right">₹${Number(bill.paid_amount).toFixed(2)}</td></tr>` : ''}
          ${bill.balance_amount > 0 ? `<tr style="color:#DC2626;font-weight:bold"><td>Balance</td><td style="text-align:right">₹${Number(bill.balance_amount).toFixed(2)}</td></tr>` : ''}
        </table>
      </div>
    </div>

    <div class="footer">
      <p style="font-size:10px;color:#777">This is a computer generated invoice</p>
      <div class="signature"><div class="sig-line"></div><p>Authorized Signatory</p></div>
    </div>
  `
  printHTML(html, `Bill - ${bill.bill_number}`)
}


// ─── DISCHARGE SUMMARY ─────────────────────────────────────────
export function printDischargeSummary(admission: any) {
  const drugs = admission.prescriptions || admission.current_medications || []
  const drugRows = drugs.length > 0
    ? drugs.map((d: any) => `
      <tr>
        <td>${d.drug_name || d.name || '—'}</td>
        <td>${d.dosage || '—'}</td>
        <td>${d.frequency || '—'}</td>
        <td>${d.duration_days || '—'} days</td>
      </tr>`).join('')
    : '<tr><td colspan="4" style="text-align:center;color:#999">—</td></tr>'

  const html = `
    <div class="title">Discharge Summary</div>
    <div class="grid-2">
      <div>
        <div class="field"><label>Patient Name</label><span>${admission.patient_name || '—'}</span></div>
        <div class="field"><label>UHID</label><span>${admission.patient_uhid || '—'}</span></div>
        <div class="field"><label>Age / Gender</label><span>${admission.patient_age || '—'} / ${admission.patient_gender || '—'}</span></div>
        <div class="field"><label>Blood Group</label><span>${admission.blood_group || '—'}</span></div>
      </div>
      <div>
        <div class="field"><label>Admission No.</label><span>${admission.admission_number || admission.id || '—'}</span></div>
        <div class="field"><label>Date of Admission</label><span>${admission.admission_date ? new Date(admission.admission_date).toLocaleDateString('en-IN') : '—'}</span></div>
        <div class="field"><label>Date of Discharge</label><span>${admission.discharge_date ? new Date(admission.discharge_date).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN')}</span></div>
        <div class="field"><label>Ward / Bed</label><span>${admission.ward_name || '—'} / ${admission.bed_number || '—'}</span></div>
      </div>
    </div>

    <div class="section-title">Admitting Doctor</div>
    <p>Dr. ${admission.doctor_name || '—'} · ${admission.doctor_specialization || ''}</p>

    <div class="section-title">Diagnosis</div>
    <p><strong>Primary:</strong> ${admission.diagnosis_at_admission || '—'}</p>
    ${admission.final_diagnosis ? `<p style="margin-top:4px"><strong>Final:</strong> ${admission.final_diagnosis}</p>` : ''}

    ${admission.chief_complaint ? `<div class="section-title">Chief Complaint</div><p>${admission.chief_complaint}</p>` : ''}

    ${admission.treatment_summary ? `<div class="section-title">Treatment Summary</div><p>${admission.treatment_summary}</p>` : ''}

    ${admission.surgical_procedure ? `<div class="section-title">Surgical Procedure</div><p>${admission.surgical_procedure}</p>` : ''}

    <div class="section-title">Discharge Medications</div>
    <table>
      <thead><tr><th>Drug</th><th>Dosage</th><th>Frequency</th><th>Duration</th></tr></thead>
      <tbody>${drugRows}</tbody>
    </table>

    ${admission.discharge_advice ? `<div class="section-title">Advice on Discharge</div><p>${admission.discharge_advice}</p>` : ''}
    ${admission.follow_up_date ? `<p style="margin-top:8px"><strong>Follow-up Date:</strong> ${new Date(admission.follow_up_date).toLocaleDateString('en-IN')}</p>` : ''}
    ${admission.diet_instructions ? `<p style="margin-top:4px"><strong>Diet:</strong> ${admission.diet_instructions}</p>` : ''}

    <div class="footer">
      <p style="font-size:10px;color:#777">Generated on ${new Date().toLocaleString('en-IN')}</p>
      <div class="signature"><div class="sig-line"></div><p>Consultant Signature</p></div>
    </div>
  `
  printHTML(html, `Discharge Summary - ${admission.patient_name || admission.id}`)
}


// ─── SALARY SLIP ───────────────────────────────────────────────
export function printSalarySlip(payroll: any) {
  const earnings = [
    { label: 'Basic Salary', amount: payroll.basic_salary || 0 },
    { label: 'HRA', amount: payroll.hra || 0 },
    { label: 'DA', amount: payroll.da || 0 },
    { label: 'TA', amount: payroll.ta || 0 },
    { label: 'Medical Allowance', amount: payroll.medical_allowance || 0 },
    { label: 'Other Allowance', amount: payroll.other_allowance || 0 },
    { label: 'Bonus', amount: payroll.bonus || 0 },
  ].filter(e => e.amount > 0)

  const deductions = [
    { label: 'PF (12%)', amount: payroll.pf_deduction || 0 },
    { label: 'Professional Tax', amount: payroll.professional_tax || 0 },
    { label: 'TDS', amount: payroll.tds || 0 },
    { label: 'Loan Deduction', amount: payroll.loan_deduction || 0 },
    { label: 'Other Deductions', amount: payroll.other_deductions || 0 },
  ].filter(d => d.amount > 0)

  const totalEarnings = earnings.reduce((s, e) => s + e.amount, 0)
  const totalDeductions = deductions.reduce((s, d) => s + d.amount, 0)

  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

  const html = `
    <div class="title">Salary Slip — ${MONTHS[(payroll.month || 1) - 1]} ${payroll.year || new Date().getFullYear()}</div>
    <div class="grid-2" style="margin-bottom:16px">
      <div>
        <div class="field"><label>Employee Name</label><span>${payroll.staff_name || payroll.employee_name || '—'}</span></div>
        <div class="field"><label>Employee ID</label><span>${payroll.employee_id || '—'}</span></div>
        <div class="field"><label>Designation</label><span>${payroll.designation || '—'}</span></div>
      </div>
      <div>
        <div class="field"><label>Department</label><span>${payroll.department || '—'}</span></div>
        <div class="field"><label>Bank Account</label><span>${payroll.bank_account || '—'}</span></div>
        <div class="field"><label>Payment Status</label><span style="text-transform:capitalize">${payroll.status || '—'}</span></div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
      <div>
        <div class="section-title">Earnings</div>
        <table>
          <tbody>
            ${earnings.map(e => `<tr><td>${e.label}</td><td style="text-align:right">₹${e.amount.toFixed(2)}</td></tr>`).join('')}
            <tr style="font-weight:bold;background:#F5F3FF"><td>Total Earnings</td><td style="text-align:right">₹${totalEarnings.toFixed(2)}</td></tr>
          </tbody>
        </table>
      </div>
      <div>
        <div class="section-title">Deductions</div>
        <table>
          <tbody>
            ${deductions.length > 0 ? deductions.map(d => `<tr><td>${d.label}</td><td style="text-align:right">₹${d.amount.toFixed(2)}</td></tr>`).join('') : '<tr><td colspan="2" style="color:#999;text-align:center">No deductions</td></tr>'}
            <tr style="font-weight:bold;background:#FFF5F5"><td>Total Deductions</td><td style="text-align:right">₹${totalDeductions.toFixed(2)}</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <div style="margin-top:16px;padding:12px;background:#F5F3FF;border-radius:8px;display:grid;grid-template-columns:1fr 1fr">
      <div>
        <p style="font-size:11px;color:#777">Working Days: ${payroll.working_days || '—'} &nbsp;|&nbsp; Present: ${payroll.present_days || '—'}</p>
      </div>
      <div style="text-align:right">
        <p style="font-size:16px;font-weight:bold;color:#4C1D95">Net Pay: ₹${Number(payroll.net_salary || totalEarnings - totalDeductions).toFixed(2)}</p>
      </div>
    </div>

    <div class="footer">
      <p style="font-size:10px;color:#777">This is a computer generated salary slip</p>
      <div class="signature"><div class="sig-line"></div><p>HR Manager</p></div>
    </div>
  `
  printHTML(html, `Salary Slip - ${payroll.staff_name || payroll.employee_id}`)
}


// ─── CONSENT FORM ──────────────────────────────────────────────
export function printConsentForm(data: {
  patient_name: string
  patient_uhid: string
  patient_age?: string
  procedure: string
  doctor_name: string
  date?: string
  ward?: string
  risks?: string[]
  type?: 'surgery' | 'procedure' | 'anaesthesia' | 'general'
}) {
  const type = data.type || 'general'
  const titleMap: Record<string, string> = {
    surgery: 'Informed Consent for Surgical Procedure',
    procedure: 'Informed Consent for Medical Procedure',
    anaesthesia: 'Anaesthesia Consent Form',
    general: 'Patient Consent Form',
  }

  const defaultRisks = {
    surgery: ['Bleeding and infection', 'Adverse reaction to anaesthesia', 'Blood clots (DVT)', 'Damage to surrounding tissues/organs', 'Need for blood transfusion', 'Post-operative complications'],
    procedure: ['Pain or discomfort', 'Infection at procedure site', 'Bleeding', 'Allergic reaction', 'Procedure may need to be repeated'],
    anaesthesia: ['Nausea and vomiting', 'Sore throat', 'Allergic reaction to anaesthetic agents', 'Temporary confusion or memory loss', 'Nerve damage (rare)', 'Serious complications (rare)'],
    general: ['The procedure may not achieve the desired outcome', 'Complications specific to the procedure', 'Need for additional treatment'],
  }

  const risks = data.risks || defaultRisks[type]

  const html = `
    <div class="title">${titleMap[type]}</div>
    <div class="grid-2" style="margin-bottom:16px">
      <div>
        <div class="field"><label>Patient Name</label><span>${data.patient_name}</span></div>
        <div class="field"><label>UHID</label><span>${data.patient_uhid}</span></div>
        ${data.patient_age ? `<div class="field"><label>Age</label><span>${data.patient_age}</span></div>` : ''}
      </div>
      <div>
        <div class="field"><label>Procedure / Surgery</label><span>${data.procedure}</span></div>
        <div class="field"><label>Consultant Doctor</label><span>Dr. ${data.doctor_name}</span></div>
        <div class="field"><label>Date</label><span>${data.date || new Date().toLocaleDateString('en-IN')}</span></div>
        ${data.ward ? `<div class="field"><label>Ward</label><span>${data.ward}</span></div>` : ''}
      </div>
    </div>

    <div class="section-title">Declaration</div>
    <p style="font-size:12px;line-height:1.7;margin-bottom:12px">
      I, <strong>${data.patient_name}</strong>, hereby give my informed consent for the above-mentioned procedure/surgery to be performed by Dr. <strong>${data.doctor_name}</strong> and their team at <strong>${HOSPITAL_NAME}</strong>.
    </p>
    <p style="font-size:12px;line-height:1.7;margin-bottom:12px">
      I confirm that the nature, purpose, risks, benefits, and alternatives of the procedure have been explained to me in a language I understand. I have had the opportunity to ask questions and have had them answered satisfactorily.
    </p>

    <div class="section-title">Risks & Possible Complications</div>
    <ul style="font-size:12px;padding-left:20px;line-height:1.8;margin-bottom:12px">
      ${risks.map(r => `<li>${r}</li>`).join('')}
    </ul>

    <p style="font-size:12px;line-height:1.7;margin-bottom:16px">
      I understand that no guarantee has been made about the outcome of the procedure. I consent to receive blood transfusion or other measures the medical team deems necessary in an emergency.
    </p>

    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:24px;margin-top:32px">
      <div class="signature">
        <div class="sig-line"></div>
        <p>Patient / Guardian Signature</p>
        <p style="font-size:10px;color:#777;margin-top:2px">${data.patient_name}</p>
      </div>
      <div class="signature">
        <div class="sig-line"></div>
        <p>Witness Signature</p>
        <p style="font-size:10px;color:#777;margin-top:2px">Name & Relationship</p>
      </div>
      <div class="signature">
        <div class="sig-line"></div>
        <p>Doctor Signature</p>
        <p style="font-size:10px;color:#777;margin-top:2px">Dr. ${data.doctor_name}</p>
      </div>
    </div>

    <div style="margin-top:20px;padding:10px;background:#F9FAFB;border:1px solid #E5E7EB;border-radius:6px">
      <p style="font-size:10px;color:#6B7280;margin:0">Date & Time: ${new Date().toLocaleString('en-IN')} &nbsp;|&nbsp; Document No: CNS-${Date.now().toString().slice(-8)}</p>
    </div>
  `
  printHTML(html, `Consent Form - ${data.patient_name}`)
}

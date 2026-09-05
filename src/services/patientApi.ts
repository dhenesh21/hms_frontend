import axios from 'axios'

// Deliberately separate from services/api.ts's `api` instance and its
// 'access_token' localStorage key — a patient and a staff member could be
// using the same browser, and a patient token must never be sent on a staff
// request or vice versa. Own key, own instance, own interceptor.
const patientApi = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  headers: { 'Content-Type': 'application/json' },
})

export const PATIENT_TOKEN_KEY = 'patient_access_token'
export const PATIENT_ID_KEY = 'patient_id'

patientApi.interceptors.request.use((config) => {
  const token = localStorage.getItem(PATIENT_TOKEN_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

patientApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(PATIENT_TOKEN_KEY)
      localStorage.removeItem(PATIENT_ID_KEY)
    }
    return Promise.reject(error)
  }
)

export const patientAuthService = {
  login: (phone: string, password: string) => patientApi.post('/patient-portal/login', { phone, password }),
  register: (data: { uhid: string; phone: string; password: string; email?: string }) =>
    patientApi.post('/patient-portal/register', data),
  me: () => patientApi.get('/patient-portal/me'),
}

export const patientDataService = {
  appointments: () => patientApi.get('/patient-portal/my-appointments'),
  opdVisits: () => patientApi.get('/patient-portal/my-opd-visits'),
  ipdAdmissions: () => patientApi.get('/patient-portal/my-ipd-admissions'),
  labOrders: () => patientApi.get('/patient-portal/my-lab-orders'),
  bills: () => patientApi.get('/patient-portal/my-bills'),
  consultations: () => patientApi.get('/telemedicine/my-consultations'),
  submitFeedback: (data: { rating: number; category?: string; comments?: string }) =>
    patientApi.post('/patient-portal/feedback', data),
  submitGrievance: (data: { subject: string; description: string; department_concerned?: string }) =>
    patientApi.post('/patient-portal/grievances', data),
  myGrievances: () => patientApi.get('/patient-portal/grievances'),
}

export function isPatientLoggedIn(): boolean {
  return !!localStorage.getItem(PATIENT_TOKEN_KEY)
}

export function patientLogout() {
  localStorage.removeItem(PATIENT_TOKEN_KEY)
  localStorage.removeItem(PATIENT_ID_KEY)
}

export default patientApi

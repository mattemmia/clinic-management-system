import { useState, useEffect } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import toast from 'react-hot-toast'
import {
  Plus, Edit, Calendar, X, Search, UserCheck, Phone, Mail, Clock, Check, AlertTriangle, ChevronDown
} from 'lucide-react'
import { collection, addDoc, updateDoc, doc, onSnapshot, query, orderBy, where } from 'firebase/firestore'
import { db } from '../../../firebase/config'

export default function Appointments() {
  const { currentUser } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [doctors, setDoctors] = useState([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    patientName: '', patientPhone: '', patientEmail: '', patientAge: '', patientGender: '',
    doctorName: '', doctorId: '', appointmentDate: '', appointmentTime: '', appointmentType: 'consultation',
    notes: '', status: 'scheduled', symptoms: '', medicalHistory: '', medications: '',
    vitalSigns: { bloodPressure: '', heartRate: '', temperature: '', weight: '' }
  })

  useEffect(() => {
    const appointmentsRef = collection(db, 'appointments')
    const q = query(appointmentsRef, orderBy('createdAt', 'desc'))
    const unsubscribeAppointments = onSnapshot(q, (snapshot) => {
      setAppointments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    })

    const doctorsRef = collection(db, 'staffData')
    const doctorsQuery = query(doctorsRef, where('role', '==', 'doctor'))
    const unsubscribeDoctors = onSnapshot(doctorsQuery, (snapshot) => {
      setDoctors(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    })

    return () => { unsubscribeAppointments(); unsubscribeDoctors() }
  }, [])

  const handleCreateAppointment = () => {
    setFormData({
      patientName: '', patientPhone: '', patientEmail: '', patientAge: '', patientGender: '',
      doctorName: '', doctorId: '', appointmentDate: getMinDate(), appointmentTime: '', appointmentType: 'consultation',
      notes: '', status: 'scheduled', symptoms: '', medicalHistory: '', medications: '',
      vitalSigns: { bloodPressure: '', heartRate: '', temperature: '', weight: '' }
    })
    setShowCreateModal(true)
  }

  const handleEditAppointment = (appointment) => {
    setSelectedAppointment(appointment)
    setFormData({ ...appointment })
    setShowEditModal(true)
  }

  const validateForm = () => {
    if (!formData.patientName.trim()) return toast.error('Please enter patient name') && false
    if (!formData.patientPhone.trim()) return toast.error('Please enter patient phone') && false
    if (!formData.patientEmail.trim()) return toast.error('Please enter patient email') && false
    if (!formData.doctorId.trim()) return toast.error('Please select a doctor') && false // CHANGED
    if (!formData.appointmentDate) return toast.error('Please select appointment date') && false
    if (!formData.appointmentTime) return toast.error('Please select appointment time') && false
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    setLoading(true)
    try {
      const appointmentData = {
        ...formData,
        updatedAt: new Date().toISOString()
      }

      if (showEditModal) {
        await updateDoc(doc(db, 'appointments', selectedAppointment.id), appointmentData)
        toast.success('Appointment updated!')
        setShowEditModal(false)
      } else {
        await addDoc(collection(db, 'appointments'), {
          ...appointmentData,
          createdAt: new Date().toISOString(),
          createdBy: currentUser?.uid || 'receptionist',
          status: 'scheduled'
        })
        toast.success('Appointment created!')
        setShowCreateModal(false)
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelAppointment = async (id) => {
    await updateDoc(doc(db, 'appointments', id), { status: 'cancelled', updatedAt: new Date().toISOString() })
    toast.success('Appointment cancelled!')
  }

  const handleRescheduleAppointment = (id) => {
    handleEditAppointment(appointments.find(apt => apt.id === id))
    toast.success('Opened for rescheduling!')
  }

  const filteredAppointments = appointments.filter(a => {
    const matchesSearch = a.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) || a.doctorName?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' || a.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/10'
      case 'completed': return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-500/10'
      case 'cancelled': return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-500/10'
      case 'rescheduled': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-500/10'
      case 'in_progress': return 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/10'
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-500/10'
    }
  }

  const generateTimeSlots = () => {
    const slots = []
    for (let hour = 11; hour <= 18; hour++) {
      const time = `${hour.toString().padStart(2, '0')}:00`
      const displayTime = hour <= 12 ? `${hour}:00 AM` : `${hour - 12}:00 PM`
      slots.push({ value: time, label: displayTime })
    }
    return slots
  }

  const getMinDate = () => new Date().toISOString().split('T')[0]
  const getMaxDate = () => { const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().split('T')[0] }
  const getStatusIcon = (status) => {
    switch (status) {
      case 'scheduled': return <Clock className="w-4 h-4" />
      case 'completed': return <Check className="w-4 h-4" />
      case 'cancelled': return <X className="w-4 h-4" />
      case 'rescheduled': return <Calendar className="w-4 h-4" />
      case 'in_progress': return <Clock className="w-4 h-4" />
      default: return <AlertTriangle className="w-4 h-4" />
    }
  }

  const inputClass = "w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-cyan-400 focus:border-transparent outline-none transition-colors"
  const selectWrapperClass = "relative"

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">

      <main className="max-w-7xl mx-auto p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 w-4 h-4" />
              <input type="text" placeholder="Search appointments..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`pl-10 ${inputClass}`} />
            </div>
            <div className={selectWrapperClass}>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={`${inputClass} appearance-none pr-10`}>
                <option value="all">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="rescheduled">Rescheduled</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-400 pointer-events-none" />
            </div>
          </div>
          <button onClick={handleCreateAppointment} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-cyan-600 dark:hover:bg-cyan-700 text-white rounded-lg transition-colors shadow">
            <Plus className="w-4 h-4" />
            <span>New Appointment</span>
          </button>
        </div>

        <div className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-6 text-slate-900 dark:text-white">Appointments ({filteredAppointments.length})</h2>
          {filteredAppointments.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-16 h-16 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400">No appointments found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAppointments.map((appointment) => (
                <div key={appointment.id} className="bg-gray-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 rounded-xl p-4">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg text-slate-900 dark:text-white">{appointment.patientName}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(appointment.status)}`}>
                          {getStatusIcon(appointment.status)}
                          <span className="capitalize">{appointment.status.replace('_', ' ')}</span>
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                          <span className="text-slate-700 dark:text-slate-300">Dr. {appointment.doctorName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                          <span className="text-slate-700 dark:text-slate-300">{new Date(appointment.appointmentDate).toLocaleDateString()} at {appointment.appointmentTime}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                          <span className="text-slate-700 dark:text-slate-300">{appointment.patientPhone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                          <span className="text-slate-700 dark:text-slate-300">{appointment.patientEmail}</span>
                        </div>
                      </div>
                      {appointment.notes && <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{appointment.notes}</p>}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleEditAppointment(appointment)} className="p-2 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-500/30">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleRescheduleAppointment(appointment.id)} className="p-2 bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-500/30">
                        <Calendar className="w-4 h-4" />
                      </button>
                      {appointment.status === 'scheduled' && (
                        <button onClick={() => handleCancelAppointment(appointment.id)} className="p-2 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-500/30">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-2xl modal-scroll overflow-y-auto shadow-xl scrollbar-thin">
            <h2 className="text-xl font-bold p-6 pb-4 text-slate-900 dark:text-white sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 z-10">
              {showCreateModal ? 'Create New Appointment' : 'Edit Appointment'}
            </h2>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Patient Name</label>
                  <input type="text" value={formData.patientName} onChange={(e) => setFormData({ ...formData, patientName: e.target.value })} className={inputClass} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Patient Phone</label>
                  <input type="tel" value={formData.patientPhone} onChange={(e) => setFormData({ ...formData, patientPhone: e.target.value })} className={inputClass} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Patient Email</label>
                  <input type="email" value={formData.patientEmail} onChange={(e) => setFormData({ ...formData, patientEmail: e.target.value })} className={inputClass} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Patient Age</label>
                  <input type="number" min="0" max="150" value={formData.patientAge} onChange={(e) => setFormData({ ...formData, patientAge: e.target.value })} className={inputClass} placeholder="Enter age" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Patient Gender</label>
                  <div className={selectWrapperClass}>
                    <select value={formData.patientGender} onChange={(e) => setFormData({ ...formData, patientGender: e.target.value })} className={`${inputClass} appearance-none pr-10`}>
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* FIXED DOCTOR DROPDOWN */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Doctor Name</label>
                  <div className={selectWrapperClass}>
                    <select
                      value={formData.doctorId} // NOW BINDS TO ID
                      onChange={(e) => {
                        const selectedDoctor = doctors.find(d => d.id === e.target.value)
                        if (selectedDoctor) {
                          setFormData({
                            ...formData,
                            doctorId: selectedDoctor.id,
                            doctorName: selectedDoctor.fullName || selectedDoctor.name
                          })
                        }
                      }}
                      className={`${inputClass} appearance-none pr-10`}
                      required
                    >
                      <option value="">{doctors.length === 0 ? 'No doctors available' : 'Select a doctor'}</option>
                      {doctors.map((doctor) => (
                        <option key={doctor.id} value={doctor.id}> {/* VALUE IS NOW ID */}
                          Dr. {doctor.fullName || doctor.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Appointment Date</label>
                  <input type="date" value={formData.appointmentDate} onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })} min={getMinDate()} max={getMaxDate()} className={`${inputClass} [color-scheme:light] dark:[color-scheme:dark]`} required />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Appointment Time</label>
                  <div className={selectWrapperClass}>
                    <select value={formData.appointmentTime} onChange={(e) => setFormData({ ...formData, appointmentTime: e.target.value })} className={`${inputClass} appearance-none pr-10`} required>
                      <option value="">Select time</option>
                      {generateTimeSlots().map((slot) => <option key={slot.value} value={slot.value}>{slot.label}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Appointment Type</label>
                  <div className={selectWrapperClass}>
                    <select value={formData.appointmentType} onChange={(e) => setFormData({ ...formData, appointmentType: e.target.value })} className={`${inputClass} appearance-none pr-10`}>
                      <option value="consultation">Consultation</option>
                      <option value="checkup">Checkup</option>
                      <option value="emergency">Emergency</option>
                      <option value="followup">Follow-up</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Status</label>
                  <div className={selectWrapperClass}>
                    <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className={`${inputClass} appearance-none pr-10`}>
                      <option value="scheduled">Scheduled</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="rescheduled">Rescheduled</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Notes</label>
                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows="3" className={inputClass} placeholder="Additional notes..." />
              </div>

              <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                <h3 className="text-lg font-semibold mb-4 text-blue-600 dark:text-cyan-400">Medical Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Symptoms</label>
                    <textarea value={formData.symptoms} onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })} rows="2" className={inputClass} placeholder="Current symptoms..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Medical History</label>
                    <textarea value={formData.medicalHistory} onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })} rows="2" className={inputClass} placeholder="Past medical conditions..." />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Current Medications</label>
                  <textarea value={formData.medications} onChange={(e) => setFormData({ ...formData, medications: e.target.value })} rows="2" className={inputClass} placeholder="Current medications and dosages..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Vital Signs</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Blood Pressure</label>
                      <input type="text" value={formData.vitalSigns.bloodPressure} onChange={(e) => setFormData({ ...formData, vitalSigns: { ...formData.vitalSigns, bloodPressure: e.target.value } })} className={inputClass} placeholder="120/80" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Heart Rate</label>
                      <input type="text" value={formData.vitalSigns.heartRate} onChange={(e) => setFormData({ ...formData, vitalSigns: { ...formData.vitalSigns, heartRate: e.target.value } })} className={inputClass} placeholder="72 bpm" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Temperature</label>
                      <input type="text" value={formData.vitalSigns.temperature} onChange={(e) => setFormData({ ...formData, vitalSigns: { ...formData.vitalSigns, temperature: e.target.value } })} className={inputClass} placeholder="98.6°F" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Weight</label>
                      <input type="text" value={formData.vitalSigns.weight} onChange={(e) => setFormData({ ...formData, vitalSigns: { ...formData.vitalSigns, weight: e.target.value } })} className={inputClass} placeholder="180 lbs" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-white dark:bg-slate-800 p-6 -m-6 mt-4 border-t border-slate-200 dark:border-slate-700">
                <button type="button" onClick={() => { setShowCreateModal(false); setShowEditModal(false) }}
                  className="px-4 py-2 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={loading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-cyan-600 dark:hover:bg-cyan-700 text-white rounded-lg disabled:opacity-50 transition-colors">
                  {loading ? 'Saving...' : (showCreateModal ? 'Create Appointment' : 'Update Appointment')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
import { useState, useEffect } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  Calendar,
  Clock,
  Phone,
  Mail,
  CheckCircle,
  AlertCircle,
  Clock as ClockIcon,
  Search,
  Play,
  Check
} from 'lucide-react'
import { collection, onSnapshot, query, where, updateDoc, doc, getDoc } from 'firebase/firestore'
import { db } from '../../../firebase/config'

export default function TokenQueue() {
  const { currentUser } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [filteredAppointments, setFilteredAppointments] = useState([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [loading, setLoading] = useState(false)
  const [doctorName, setDoctorName] = useState('')
  const [currentToken, setCurrentToken] = useState(null)
  const [error, setError] = useState('')

  // Fetch doctor's name
  useEffect(() => {
    if (!currentUser) return
    const fetchDoctorName = async () => {
      try {
        const userDocRef = doc(db, 'staffData', currentUser.uid)
        const userDoc = await getDoc(userDocRef)
        if (userDoc.exists()) {
          setDoctorName(userDoc.data().fullName || currentUser.displayName || 'Unknown Doctor')
        } else {
          setDoctorName(currentUser.displayName || 'Unknown Doctor')
        }
      } catch (error) {
        console.error('Error fetching doctor name:', error)
        setError('Error fetching doctor information')
        toast.error('Error fetching doctor information')
        setDoctorName(currentUser.displayName || 'Unknown Doctor')
      }
    }
    fetchDoctorName()
  }, [currentUser])

  // Fetch appointments
  useEffect(() => {
    if (!selectedDate || !doctorName) return
    setLoading(true)
    setError('')
    try {
      const appointmentsRef = collection(db, 'appointments')
      const q = query(appointmentsRef, where('appointmentDate', '==', selectedDate), where('doctorName', '==', doctorName))
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const appointmentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        const sortedAppointments = appointmentsData.sort((a, b) => {
          if (a.tokenNumber && b.tokenNumber) return a.tokenNumber - b.tokenNumber
          if (a.tokenNumber) return -1
          if (b.tokenNumber) return 1
          return new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
        })
        setAppointments(sortedAppointments)
        setFilteredAppointments(sortedAppointments)
        setCurrentToken(sortedAppointments.find(apt => apt.status === 'token_generated' || apt.status === 'in_progress'))
        setLoading(false)
      }, (error) => {
        setError('Error loading appointments')
        setLoading(false)
        toast.error('Error loading appointments')
      })
      return () => unsubscribe()
    } catch (error) {
      setError('Error loading appointments')
      setLoading(false)
      toast.error('Error loading appointments')
    }
  }, [selectedDate, doctorName])

  // Filter appointments
  useEffect(() => {
    let filtered = appointments
    if (searchTerm) {
      filtered = filtered.filter(appointment =>
        appointment.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.patientPhone.includes(searchTerm) ||
        (appointment.tokenNumber && appointment.tokenNumber.toString().includes(searchTerm))
      )
    }
    if (filterStatus !== 'all') filtered = filtered.filter(appointment => appointment.status === filterStatus)
    setFilteredAppointments(filtered)
  }, [appointments, searchTerm, filterStatus])

  const updateAppointmentStatus = async (appointmentId, newStatus) => {
    try {
      await updateDoc(doc(db, 'appointments', appointmentId), { status: newStatus, updatedAt: new Date().toISOString() })
      toast.success(`Status updated to ${newStatus.replace('_', '')}`)
    } catch (error) {
      toast.error('Error updating appointment status')
    }
  }

  const callNextPatient = async () => {
    const nextPatient = appointments.find(apt => apt.status === 'token_generated')
    if (nextPatient) {
      await updateAppointmentStatus(nextPatient.id, 'in_progress')
      toast.success(`Calling ${nextPatient.patientName} - Token ${nextPatient.tokenNumber}`)
    } else toast.info('No more patients waiting')
  }

  const completeConsultation = async () => {
    if (currentToken && currentToken.status === 'in_progress') {
      await updateAppointmentStatus(currentToken.id, 'completed')
      toast.success(`Consultation completed for ${currentToken.patientName}`)
    }
  }

  const getStatusInfo = (status) => {
    switch (status) {
      case 'scheduled': return { color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-400/10', icon: ClockIcon }
      case 'token_generated': return { color: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-400/10', icon: CheckCircle }
      case 'in_progress': return { color: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-400/10', icon: AlertCircle }
      case 'completed': return { color: 'text-green-700 dark:text-green-500 bg-green-50 dark:bg-green-500/10', icon: CheckCircle }
      case 'cancelled': return { color: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-400/10', icon: AlertCircle }
      default: return { color: 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-400/10', icon: ClockIcon }
    }
  }

  const getTodayDisplay = () => new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const queueStats = {
    waiting: appointments.filter(apt => apt.status === 'token_generated').length,
    inProgress: appointments.filter(apt => apt.status === 'in_progress').length,
    completed: appointments.filter(apt => apt.status === 'completed').length,
    total: appointments.filter(apt => apt.tokenNumber).length
  }

  return (
    <div className="p-6">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-400/30 rounded-xl p-4 mb-6">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <span className="text-red-700 dark:text-red-300">{error}</span>
          </div>
        </div>
      )}

      {/* Current Token Display */}
      {currentToken && (
        <div className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-xl p-6 mb-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-blue-100 dark:bg-blue-500/20 rounded-xl flex items-center justify-center">
                <span className="text-4xl font-bold text-blue-600 dark:text-blue-400">{currentToken.tokenNumber}</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Current Patient</h2>
                <p className="text-lg text-slate-700 dark:text-slate-200">{currentToken.patientName}</p>
                <p className="text-slate-600 dark:text-slate-400">{currentToken.patientAge} years, {currentToken.patientGender} • {currentToken.appointmentTime}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {currentToken.status === 'in_progress' && (
                <button onClick={completeConsultation} className="flex items-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg">
                  <Check className="w-4 h-4" /><span>Complete</span>
                </button>
              )}
              <button onClick={callNextPatient} disabled={queueStats.waiting === 0} className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white rounded-lg">
                <Play className="w-4 h-4" /><span>Call Next</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Date Selection and Stats */}
      <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Today's Queue</h2>
            <p className="text-slate-600 dark:text-slate-400">{getTodayDisplay()}</p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="px-4 py-2 bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none" />
            <div className="text-center"><div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{queueStats.total}</div><div className="text-sm text-slate-600 dark:text-slate-400">Total</div></div>
            <div className="text-center"><div className="text-2xl font-bold text-green-600 dark:text-green-400">{queueStats.waiting}</div><div className="text-sm text-slate-600 dark:text-slate-400">Waiting</div></div>
            <div className="text-center"><div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{queueStats.inProgress}</div><div className="text-sm text-slate-600 dark:text-slate-400">In Progress</div></div>
            <div className="text-center"><div className="text-2xl font-bold text-green-700 dark:text-green-500">{queueStats.completed}</div><div className="text-sm text-slate-600 dark:text-slate-400">Completed</div></div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-xl p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search by name, phone, or token..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none" />
          </div>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none">
            <option value="all">All Status</option>
            <option value="token_generated">Waiting</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Queue List */}
      <div className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center min-h-96"><div className="text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div><p className="text-slate-600 dark:text-slate-400">Loading queue...</p></div></div>
        ) : filteredAppointments.length === 0 ? (
          <div className="p-8 text-center"><div className="text-slate-600 dark:text-slate-400 text-lg mb-2">No patients in queue</div><div className="text-slate-500 dark:text-slate-500 text-sm">{searchTerm || filterStatus !== 'all' ? 'Try adjusting your search or filters.' : 'No appointments scheduled for the selected date.'}</div></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-slate-700 dark:text-slate-300">Token</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-slate-700 dark:text-slate-300">Patient</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-slate-700 dark:text-slate-300">Contact</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-slate-700 dark:text-slate-300">Appointment</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-slate-700 dark:text-slate-300">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-slate-700 dark:text-slate-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredAppointments.map((appointment) => {
                  const statusInfo = getStatusInfo(appointment.status)
                  const StatusIcon = statusInfo.icon
                  const isCurrentPatient = currentToken && currentToken.id === appointment.id
                  return (
                    <tr key={appointment.id} className={`hover: bg - slate - 50 dark: hover: bg - slate - 700 / 30 transition - colors ${isCurrentPatient ? 'bg-blue-50 dark:bg-blue-500/10 border-l-4 border-l-blue-600 dark:border-l-blue-400' : ''} `}>
                      <td className="px-6 py-4">{appointment.tokenNumber ? (<div className="flex items-center space-x-2"><div className={`w - 12 h - 12 rounded - lg flex items - center justify - center ${isCurrentPatient ? 'bg-blue-200 dark:bg-blue-500/30' : 'bg-blue-100 dark:bg-blue-500/20'} `}><span className="text-xl font-bold text-blue-600 dark:text-blue-400">{appointment.tokenNumber}</span></div>{isCurrentPatient && (<span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full">Current</span>)}</div>) : (<div className="text-slate-400">-</div>)}</td>
                      <td className="px-6 py-4"><div><div className="font-medium text-slate-900 dark:text-white">{appointment.patientName}</div><div className="text-sm text-slate-600 dark:text-slate-400">{appointment.patientAge} years, {appointment.patientGender}</div></div></td>
                      <td className="px-6 py-4"><div className="space-y-1"><div className="flex items-center space-x-2 text-sm text-slate-700 dark:text-slate-300"><Phone className="w-3 h-3 text-slate-400" /><span>{appointment.patientPhone}</span></div>{appointment.patientEmail && (<div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400"><Mail className="w-3 h-3 text-slate-400" /><span>{appointment.patientEmail}</span></div>)}</div></td>
                      <td className="px-6 py-4"><div className="space-y-1"><div className="flex items-center space-x-2 text-sm text-slate-700 dark:text-slate-300"><Calendar className="w-3 h-3 text-slate-400" /><span>{appointment.appointmentDate}</span></div><div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400"><Clock className="w-3 h-3 text-slate-400" /><span>{appointment.appointmentTime}</span></div></div></td>
                      <td className="px-6 py-4"><span className={`inline - flex items - center px - 3 py - 1 rounded - full text - xs font - medium ${statusInfo.color} `}><StatusIcon className="w-3 h-3 mr-1" />{appointment.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span></td>
                      <td className="px-6 py-4"><div className="flex items-center space-x-2">{appointment.status === 'token_generated' && (<button onClick={() => updateAppointmentStatus(appointment.id, 'in_progress')} className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-xs rounded-lg">Start</button>)}{appointment.status === 'in_progress' && (<button onClick={() => updateAppointmentStatus(appointment.id, 'completed')} className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg">Complete</button>)}<Link to={`/ doctor / prescriptions / create / ${appointment.id} `} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg">Prescription</Link></div></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
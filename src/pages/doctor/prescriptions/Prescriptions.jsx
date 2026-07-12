import { useState, useEffect } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  User,
  Calendar,
  Clock,
  Phone,
  Mail,
  Plus,
  Search,
  FileText,
  Pill,
  Eye,
  Edit,
  Trash2,
  CalendarDays,
  CalendarRange,
  CalendarCheck
} from 'lucide-react'
import { collection, onSnapshot, query, orderBy, doc, deleteDoc } from 'firebase/firestore'
import { db } from '../../../firebase/config'

export default function Prescriptions() {
  const { currentUser } = useAuth()
  const [prescriptions, setPrescriptions] = useState([])
  const [filteredPrescriptions, setFilteredPrescriptions] = useState([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [viewMode, setViewMode] = useState('today') // today, week, month, all
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [loading, setLoading] = useState(false)

  // Fetch prescriptions for the logged-in doctor
  useEffect(() => {
    if (!currentUser) return
    setLoading(true)
    const prescriptionsRef = collection(db, 'prescriptions')
    const q = query(prescriptionsRef, orderBy('createdAt', 'desc'))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allPrescriptions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      const doctorPrescriptions = allPrescriptions.filter(prescription => {
        const prescriptionDoctorName = prescription.doctorName || ''
        const currentDoctorName = currentUser.displayName || ''
        if (prescriptionDoctorName === currentDoctorName) return true
        if (prescriptionDoctorName.toLowerCase() === currentDoctorName.toLowerCase()) return true
        const cleanPrescriptionName = prescriptionDoctorName.replace(/^Dr\.\s*/i, '').trim()
        const cleanCurrentName = currentDoctorName.replace(/^Dr\.\s*/i, '').trim()
        if (cleanPrescriptionName === cleanCurrentName) return true
        const withDrPrescriptionName = prescriptionDoctorName.startsWith('Dr.') ? prescriptionDoctorName : `Dr. ${prescriptionDoctorName}`
        const withDrCurrentName = currentDoctorName.startsWith('Dr.') ? currentDoctorName : `Dr. ${currentDoctorName}`
        if (withDrPrescriptionName === withDrCurrentName) return true
        return false
      })
      setPrescriptions(doctorPrescriptions)
      setLoading(false)
      if (doctorPrescriptions.length > 0) toast.success(`Loaded ${doctorPrescriptions.length} prescriptions`)
      else toast.success('No prescriptions found')
    }, (error) => {
      console.error('Error fetching prescriptions:', error)
      toast.error('Error loading prescriptions')
      setLoading(false)
    })
    return () => unsubscribe()
  }, [currentUser])

  useEffect(() => {
    let filtered = prescriptions
    if (viewMode === 'today') {
      filtered = filtered.filter(prescription => prescription.prescriptionDate === selectedDate)
    } else if (viewMode === 'week') {
      const startOfWeek = new Date(selectedDate)
      const endOfWeek = new Date(selectedDate)
      endOfWeek.setDate(endOfWeek.getDate() + 7)
      filtered = filtered.filter(prescription => {
        const prescriptionDate = new Date(prescription.prescriptionDate)
        return prescriptionDate >= startOfWeek && prescriptionDate < endOfWeek
      })
    } else if (viewMode === 'month') {
      const startOfMonth = new Date(selectedDate)
      const endOfMonth = new Date(selectedDate)
      endOfMonth.setMonth(endOfMonth.getMonth() + 1)
      filtered = filtered.filter(prescription => {
        const prescriptionDate = new Date(prescription.prescriptionDate)
        return prescriptionDate >= startOfMonth && prescriptionDate < endOfMonth
      })
    }
    if (searchTerm) {
      filtered = filtered.filter(prescription =>
        prescription.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prescription.diagnosis.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    if (filterStatus !== 'all') {
      filtered = filtered.filter(prescription => prescription.status === filterStatus)
    }
    setFilteredPrescriptions(filtered)
  }, [prescriptions, selectedDate, viewMode, searchTerm, filterStatus])

  const handleDeletePrescription = async (prescriptionId) => {
    if (window.confirm('Are you sure you want to delete this prescription? This action cannot be undone.')) {
      try {
        await deleteDoc(doc(db, 'prescriptions', prescriptionId))
        toast.success('Prescription deleted successfully!')
      } catch (error) {
        toast.error(`Error deleting prescription: ${error.message}`)
      }
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-400/10'
      case 'completed': return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-400/10'
      case 'discontinued': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-400/10'
      case 'pending': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-400/10'
      default: return 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-400/10'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <Pill className="w-4 h-4" />
      case 'completed': return <FileText className="w-4 h-4" />
      case 'discontinued': return <Trash2 className="w-4 h-4" />
      case 'pending': return <Clock className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  const todayPrescriptions = filteredPrescriptions.filter(prescription => prescription.prescriptionDate === selectedDate)

  return (
    <div className="p-6">
      {/* Controls */}
      <div className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-xl p-6 mb-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex flex-col md:flex-row gap-4 w-full lg:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search patients or diagnosis..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none w-full"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {['today', 'week', 'month', 'all'].map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-2 rounded-lg transition-colors flex items-center space-x-2 ${viewMode === mode
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                    }`}
                >
                  {mode === 'today' && <CalendarDays className="w-4 h-4" />}
                  {mode === 'week' && <CalendarRange className="w-4 h-4" />}
                  {mode === 'month' && <CalendarCheck className="w-4 h-4" />}
                  {mode === 'all' && <FileText className="w-4 h-4" />}
                  <span className="capitalize">{mode}</span>
                </button>
              ))}
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="discontinued">Discontinued</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div className="flex gap-2">
            <Link to="/doctor/prescriptions/create" className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg">
              <Plus className="w-4 h-4" /><span>New Prescription</span>
            </Link>
            <Link to="/doctor/prescriptions/medicines" className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
              <Pill className="w-4 h-4" /><span>Medicines</span>
            </Link>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Today's Prescriptions */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4 flex items-center space-x-2 text-slate-900 dark:text-white">
          <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
          <span>Today's Prescriptions ({todayPrescriptions.length})</span>
        </h2>

        {loading ? (
          <div className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-xl p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
            <p className="text-slate-600 dark:text-slate-400 mt-4">Loading prescriptions...</p>
          </div>
        ) : todayPrescriptions.length === 0 ? (
          <div className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-xl p-8 text-center">
            <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">No prescriptions for today</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {todayPrescriptions.map((prescription) => (
              <div key={prescription.id} className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-xl p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{prescription.patientName}</h3>
                    <p className="text-slate-600 dark:text-slate-400">{prescription.patientAge || 'N/A'} years, {prescription.patientGender || 'N/A'}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(prescription.status)}`}>
                    {getStatusIcon(prescription.status)}<span className="capitalize">{prescription.status}</span>
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300"><Calendar className="w-4 h-4 text-slate-400" /><span>{prescription.prescriptionDate}</span></div>
                  <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300"><Phone className="w-4 h-4 text-slate-400" /><span>{prescription.patientPhone}</span></div>
                  <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300"><Mail className="w-4 h-4 text-slate-400" /><span>{prescription.patientEmail}</span></div>
                </div>

                {prescription.diagnosis && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Diagnosis:</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{prescription.diagnosis}</p>
                  </div>
                )}

                <div className="mb-4">
                  <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Medicines ({prescription.medicines?.length || 0}):</h4>
                  <div className="space-y-1">
                    {prescription.medicines?.slice(0, 3).map((medicine, index) => (
                      <p key={index} className="text-sm text-slate-600 dark:text-slate-400">• {medicine.name} - {medicine.dosage}</p>
                    ))}
                    {prescription.medicines?.length > 3 && (<p className="text-sm text-slate-500">+{prescription.medicines.length - 3} more</p>)}
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Link to={`/doctor/prescriptions/view/${prescription.id}`} className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm flex items-center justify-center space-x-2"><Eye className="w-4 h-4" /><span>View</span></Link>
                  <Link to={`/doctor/prescriptions/edit/${prescription.id}`} className="px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg"><Edit className="w-4 h-4" /></Link>
                  <button onClick={() => handleDeletePrescription(prescription.id)} className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* All Prescriptions Table */}
      {filteredPrescriptions.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center space-x-2 text-slate-900 dark:text-white">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>All Prescriptions ({filteredPrescriptions.length})</span>
          </h2>
          <div className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-xl p-6 overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="text-left py-3 px-4 text-slate-700 dark:text-slate-300">Patient</th>
                  <th className="text-left py-3 px-4 text-slate-700 dark:text-slate-300">Date</th>
                  <th className="text-left py-3 px-4 text-slate-700 dark:text-slate-300">Diagnosis</th>
                  <th className="text-left py-3 px-4 text-slate-700 dark:text-slate-300">Medicines</th>
                  <th className="text-left py-3 px-4 text-slate-700 dark:text-slate-300">Status</th>
                  <th className="text-left py-3 px-4 text-slate-700 dark:text-slate-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPrescriptions.map((prescription) => (
                  <tr key={prescription.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="py-3 px-4"><p className="font-medium text-slate-900 dark:text-white">{prescription.patientName}</p><p className="text-sm text-slate-600 dark:text-slate-400">{prescription.patientPhone}</p></td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{prescription.prescriptionDate}</td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{prescription.diagnosis || 'N/A'}</td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{prescription.medicines?.length || 0} medicines</td>
                    <td className="py-3 px-4"><span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 w-fit ${getStatusColor(prescription.status)}`}>{getStatusIcon(prescription.status)}<span className="capitalize">{prescription.status}</span></span></td>
                    <td className="py-3 px-4"><div className="flex space-x-2"><Link to={`/doctor/prescriptions/view/${prescription.id}`} className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs">View</Link><Link to={`/doctor/prescriptions/edit/${prescription.id}`} className="px-2 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-xs">Edit</Link><button onClick={() => handleDeletePrescription(prescription.id)} className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs">Delete</button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
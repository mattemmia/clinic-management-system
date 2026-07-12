import { useState, useEffect } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  User, Calendar, Clock, Phone, Mail, Search, FileText, Pill, Eye, Download, Printer, ArrowLeft,
  CalendarDays, CalendarRange, CalendarCheck, FileDown, Users, CheckCircle, AlertTriangle
} from 'lucide-react'
import { collection, onSnapshot, query, orderBy, where } from 'firebase/firestore'
import { db } from '../../../firebase/config'
import { downloadPrescriptionPDF } from './PrescriptionPdfGenerator'

export default function ReceptionistPrescriptions() {
  const { currentUser } = useAuth()
  const [prescriptions, setPrescriptions] = useState([])
  const [filteredPrescriptions, setFilteredPrescriptions] = useState([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [viewMode, setViewMode] = useState('today') // today, week, month, all
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterDoctor, setFilterDoctor] = useState('all')
  const [loading, setLoading] = useState(false)
  const [doctors, setDoctors] = useState([])

  // Fetch prescriptions
  useEffect(() => {
    if (!currentUser) return
    setLoading(true)

    const prescriptionsRef = collection(db, 'prescriptions')
    const q = query(prescriptionsRef, orderBy('createdAt', 'desc'))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prescriptionsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setPrescriptions(prescriptionsData)
      setLoading(false)
      prescriptionsData.length > 0
        ? toast.success(`Loaded ${prescriptionsData.length} prescriptions`)
        : toast.success('No prescriptions found')
    }, (error) => {
      console.error('Error fetching prescriptions:', error)
      toast.error('Error loading prescriptions')
      setLoading(false)
    })

    return () => unsubscribe()
  }, [currentUser])

  // Fetch doctors
  useEffect(() => {
    const staffRef = collection(db, 'staffData')
    const staffQuery = query(staffRef, where('role', '==', 'doctor'))
    const unsubscribe = onSnapshot(staffQuery, (snapshot) => {
      setDoctors(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    let filtered = prescriptions

    if (viewMode === 'today') {
      filtered = filtered.filter(p => p.prescriptionDate === selectedDate)
    } else if (viewMode === 'week') {
      const startOfWeek = new Date(selectedDate)
      const endOfWeek = new Date(selectedDate)
      endOfWeek.setDate(endOfWeek.getDate() + 7)
      filtered = filtered.filter(p => {
        const d = new Date(p.prescriptionDate)
        return d >= startOfWeek && d < endOfWeek
      })
    } else if (viewMode === 'month') {
      const startOfMonth = new Date(selectedDate)
      const endOfMonth = new Date(selectedDate)
      endOfMonth.setMonth(endOfMonth.getMonth() + 1)
      filtered = filtered.filter(p => {
        const d = new Date(p.prescriptionDate)
        return d >= startOfMonth && d < endOfMonth
      })
    }

    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (filterStatus !== 'all') filtered = filtered.filter(p => p.status === filterStatus)
    if (filterDoctor !== 'all') filtered = filtered.filter(p => p.doctorName === filterDoctor)

    setFilteredPrescriptions(filtered)
  }, [prescriptions, selectedDate, viewMode, searchTerm, filterStatus, filterDoctor])

  const handleDownloadPDF = (prescription) => {
    const success = downloadPrescriptionPDF(prescription)
    success ? toast.success(`PDF downloaded for ${prescription.patientName}`) : toast.error(`Failed to generate PDF`)
  }

  const handleDownloadAllPDFs = () => {
    filteredPrescriptions.forEach((prescription, index) => {
      setTimeout(() => downloadPrescriptionPDF(prescription), index * 1000)
    })
    toast.success(`Started downloading ${filteredPrescriptions.length} prescriptions`)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-500/10'
      case 'completed': return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/10'
      case 'discontinued': return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-500/10'
      case 'pending': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-500/10'
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-500/10'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <Pill className="w-4 h-4" />
      case 'completed': return <FileText className="w-4 h-4" />
      case 'discontinued': return <AlertTriangle className="w-4 h-4" />
      case 'pending': return <Clock className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  const todayPrescriptions = filteredPrescriptions.filter(p => p.prescriptionDate === selectedDate)

  const viewButtons = [
    { mode: 'today', label: 'Today', icon: CalendarDays },
    { mode: 'week', label: 'Week', icon: CalendarRange },
    { mode: 'month', label: 'Month', icon: CalendarCheck },
    { mode: 'all', label: 'All', icon: FileText }
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        {/* Top Bar */}
        <div className="flex justify-between items-center mb-6">
          <Link to="/receptionist" className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Dashboard</span>
          </Link>
          <button onClick={handleDownloadAllPDFs} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white rounded-lg">
            <FileDown className="w-4 h-4" />
            <span>Download All PDFs</span>
          </button>
        </div>

        {/* Controls */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 w-full lg:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search patients, doctors, or diagnosis..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-cyan-400 outline-none"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {viewButtons.map(({ mode, label, icon: Icon }) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${viewMode === mode
                      ? 'bg-blue-600 dark:bg-cyan-600 text-white'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-cyan-400 outline-none">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="discontinued">Discontinued</option>
              <option value="pending">Pending</option>
            </select>

            <select value={filterDoctor} onChange={(e) => setFilterDoctor(e.target.value)} className="px-3 py-2 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-cyan-400 outline-none">
              <option value="all">All Doctors</option>
              {doctors.map(doctor => <option key={doctor.id} value={doctor.fullName}>{doctor.fullName}</option>)}
            </select>
          </div>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-cyan-400 outline-none [color-scheme:light] dark:[color-scheme:dark]"
          />
        </div>

        {/* Today's Prescriptions */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
            <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span>Today's Prescriptions ({todayPrescriptions.length})</span>
          </h2>

          {loading ? (
            <div className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-2xl p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-cyan-400 mx-auto"></div>
              <p className="text-slate-500 dark:text-slate-400 mt-4">Loading prescriptions...</p>
            </div>
          ) : todayPrescriptions.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-2xl p-8 text-center">
              <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400">No prescriptions for today</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {todayPrescriptions.map((prescription) => (
                <div key={prescription.id} className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{prescription.patientName}</h3>
                      <p className="text-slate-500 dark:text-slate-400">{prescription.patientAge || 'N/A'} years, {prescription.patientGender || 'N/A'}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(prescription.status)}`}>
                      {getStatusIcon(prescription.status)}
                      <span className="capitalize">{prescription.status}</span>
                    </span>
                  </div>

                  <div className="space-y-3 mb-4 text-sm">
                    <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-slate-500 dark:text-slate-400" /><span className="text-slate-700 dark:text-slate-300">{prescription.prescriptionDate}</span></div>
                    <div className="flex items-center gap-2"><Users className="w-4 h-4 text-slate-500 dark:text-slate-400" /><span className="text-slate-700 dark:text-slate-300">Dr. {prescription.doctorName}</span></div>
                    <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-slate-500 dark:text-slate-400" /><span className="text-slate-700 dark:text-slate-300">{prescription.patientPhone}</span></div>
                    <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-slate-500 dark:text-slate-400" /><span className="text-slate-700 dark:text-slate-300">{prescription.patientEmail}</span></div>
                  </div>

                  {prescription.diagnosis && <div className="mb-4"><h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Diagnosis:</h4><p className="text-sm text-slate-600 dark:text-slate-400">{prescription.diagnosis}</p></div>}

                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Medicines ({prescription.medicines?.length || 0}):</h4>
                    <div className="space-y-1">
                      {prescription.medicines?.slice(0, 3).map((medicine, index) => <p key={index} className="text-sm text-slate-600 dark:text-slate-400">• {medicine.name} - {medicine.dosage}</p>)}
                      {prescription.medicines?.length > 3 && <p className="text-sm text-slate-500 dark:text-slate-400">+{prescription.medicines.length - 3} more</p>}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link to={`/receptionist/prescriptions/view/${prescription.id}`} className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-cyan-600 dark:hover:bg-cyan-700 text-white rounded-lg text-sm flex items-center justify-center gap-2">
                      <Eye className="w-4 h-4" /><span>View</span>
                    </Link>
                    <button onClick={() => handleDownloadPDF(prescription)} className="px-3 py-2 bg-green-600 hover:bg-green-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white rounded-lg text-sm">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* All Prescriptions Table */}
        {filteredPrescriptions.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span>All Prescriptions ({filteredPrescriptions.length})</span>
            </h2>

            <div className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-3 px-4 text-slate-700 dark:text-slate-300">Patient</th>
                    <th className="text-left py-3 px-4 text-slate-700 dark:text-slate-300">Doctor</th>
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
                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-900 dark:text-white">{prescription.patientName}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{prescription.patientPhone}</p>
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{prescription.doctorName}</td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{prescription.prescriptionDate}</td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{prescription.diagnosis || 'N/A'}</td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{prescription.medicines?.length || 0} medicines</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${getStatusColor(prescription.status)}`}>
                          {getStatusIcon(prescription.status)}
                          <span className="capitalize">{prescription.status}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Link to={`/receptionist/prescriptions/view/${prescription.id}`} className="px-2 py-1 bg-blue-600 hover:bg-blue-700 dark:bg-cyan-600 dark:hover:bg-cyan-700 text-white rounded text-xs">View</Link>
                          <button onClick={() => handleDownloadPDF(prescription)} className="px-2 py-1 bg-green-600 hover:bg-green-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white rounded text-xs">PDF</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
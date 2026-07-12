import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import toast from 'react-hot-toast'
import {
  User, Calendar, Clock, Phone, Mail, Check, X, Search,
  Stethoscope, Loader2, Users, CheckCircle, XCircle, Timer, CalendarX
} from 'lucide-react'

import { collection, onSnapshot, query, where, orderBy, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../../firebase/config'

export default function DoctorAppointments() {
  const { currentUser } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [viewMode, setViewMode] = useState('today')
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [loading, setLoading] = useState(true)

  // Fetch appointments for the logged-in doctor
  useEffect(() => {
    if (!currentUser) return
    setLoading(true)

    const appointmentsRef = collection(db, 'appointments')
    const q = query(
      appointmentsRef,
      where('doctorId', '==', currentUser.uid),
      orderBy('appointmentDate', 'desc'),
      orderBy('appointmentTime', 'asc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const doctorAppointments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setAppointments(doctorAppointments)
      setLoading(false)
    }, (error) => {
      console.error('Error fetching appointments:', error)
      toast.error('Error loading appointments')
      setLoading(false)
    })

    return () => unsubscribe()
  }, [currentUser])

  const filteredAppointments = useMemo(() => {
    let filtered = appointments

    if (viewMode === 'today') {
      filtered = filtered.filter(apt => apt.appointmentDate === selectedDate)
    } else if (viewMode === 'week') {
      const start = new Date(selectedDate)
      const end = new Date(start)
      end.setDate(end.getDate() + 7)
      filtered = filtered.filter(apt => {
        const aptDate = new Date(apt.appointmentDate)
        return aptDate >= start && aptDate < end
      })
    } else if (viewMode === 'month') {
      const start = new Date(selectedDate)
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 1)
      filtered = filtered.filter(apt => {
        const aptDate = new Date(apt.appointmentDate)
        return aptDate >= start && aptDate < end
      })
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(apt => apt.status === statusFilter)
    }

    if (searchTerm) {
      filtered = filtered.filter(apt =>
        apt.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.type?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    return filtered
  }, [appointments, selectedDate, viewMode, statusFilter, searchTerm])

  const stats = useMemo(() => ({
    total: appointments.length,
    scheduled: appointments.filter(a => a.status === 'scheduled').length,
    completed: appointments.filter(a => a.status === 'completed').length,
    cancelled: appointments.filter(a => a.status === 'cancelled').length,
  }), [appointments])

  const handleUpdateStatus = async (appointmentId, status) => {
    try {
      await updateDoc(doc(db, 'appointments', appointmentId), {
        status,
        updatedAt: serverTimestamp()
      })
      toast.success(`Appointment marked as ${status}`)
      if (status === 'completed' || status === 'cancelled') setSelectedAppointment(null)
    } catch (error) {
      toast.error(`Error: ${error.message}`)
    }
  }

  const getStatusBadge = (status) => {
    const styles = {
      scheduled: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      in_progress: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      completed: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      cancelled: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    }
    return <span className={`px-3 py-1 rounded-full text-xs font-semibold border capitalize ${styles[status]}`}>{status.replace('_', ' ')}</span>
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#030712] text-slate-900 dark:text-white transition-colors duration-300">

      {/* Page Title instead of header */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-500/10 rounded-xl">
            <Stethoscope className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Appointments</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Manage your patient appointments</p>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-4 md:p-6 pt-0">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total', value: stats.total, icon: Users, color: 'text-blue-500' },
            { label: 'Scheduled', value: stats.scheduled, icon: Timer, color: 'text-amber-500' },
            { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'text-emerald-500' },
            { label: 'Cancelled', value: stats.cancelled, icon: XCircle, color: 'text-rose-500' },
          ].map(stat => (
            <div key={stat.label} className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 rounded-2xl p-4 transition-all">
              <stat.icon className={`w-6 h-6 ${stat.color} mb-2`} />
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 rounded-2xl p-4 mb-6 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input type="text" placeholder="Search patient or type..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:border-blue-500 outline-none text-slate-900 dark:text-white" />
            </div>
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white" />
          </div>

          <div className="flex flex-wrap gap-2">
            {['today', 'week', 'month'].map(mode => (
              <button key={mode} onClick={() => setViewMode(mode)}
                className={`px-4 py-2 rounded-lg capitalize transition-all ${viewMode === mode ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10'}`}>
                {mode}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {['all', 'scheduled', 'in_progress', 'completed', 'cancelled'].map(status => (
              <button key={status} onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg capitalize text-sm ${statusFilter === status ? 'bg-slate-200 dark:bg-white/20' : 'bg-slate-100 dark:bg-white/5'}`}>
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Appointments Grid */}
        {loading ? <Loader2 className="w-10 h-10 animate-spin mx-auto my-20 text-blue-500" /> : (
          filteredAppointments.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-white/10">
              <CalendarX className="w-12 h-12 mx-auto text-slate-400 mb-3" />
              <p className="text-slate-500 dark:text-slate-400">No appointments found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredAppointments.map((apt) => (
                <div key={apt.id} onClick={() => setSelectedAppointment(apt)}
                  className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:border-blue-500/30 hover:shadow-lg transition-all cursor-pointer">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{apt.patientName}</h3>
                    {getStatusBadge(apt.status)}
                  </div>
                  <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                    <p className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {apt.appointmentDate}</p>
                    <p className="flex items-center gap-2"><Clock className="w-4 h-4" /> {apt.appointmentTime}</p>
                    <p className="flex items-center gap-2"><User className="w-4 h-4" /> {apt.patientAge} yrs • {apt.patientGender}</p>
                    <p className="flex items-center gap-2"><Stethoscope className="w-4 h-4" /> {apt.type}</p>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </main>

      {/* Modal */}
      {selectedAppointment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setSelectedAppointment(null)}>
          <div className="bg-white dark:bg-[#111827] border-slate-200 dark:border-white/10 rounded-2xl p-6 w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{selectedAppointment.patientName}</h2>
              {getStatusBadge(selectedAppointment.status)}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm mb-6 text-slate-700 dark:text-slate-300">
              <p className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {selectedAppointment.appointmentDate}</p>
              <p className="flex items-center gap-2"><Clock className="w-4 h-4" /> {selectedAppointment.appointmentTime}</p>
              <p className="flex items-center gap-2"><Phone className="w-4 h-4" /> {selectedAppointment.patientPhone}</p>
              <p className="flex items-center gap-2"><Mail className="w-4 h-4" /> {selectedAppointment.patientEmail}</p>
              <p><b>Age:</b> {selectedAppointment.patientAge}</p>
              <p><b>Gender:</b> {selectedAppointment.patientGender}</p>
              <p className="col-span-2"><b>Type:</b> {selectedAppointment.type}</p>
            </div>

            <div className="mb-6">
              <p className="font-semibold mb-2 text-slate-900 dark:text-white">Symptoms / Notes:</p>
              <p className="text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/5 p-3 rounded-lg">{selectedAppointment.symptoms || 'No notes'}</p>
            </div>

            {selectedAppointment.status !== 'completed' && selectedAppointment.status !== 'cancelled' && (
              <div className="flex gap-3 justify-end">
                <button onClick={() => handleUpdateStatus(selectedAppointment.id, 'cancelled')} className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg flex items-center gap-2"><X className="w-4 h-4" /> Cancel</button>
                <button onClick={() => handleUpdateStatus(selectedAppointment.id, 'in_progress')} className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg flex items-center gap-2"><Timer className="w-4 h-4" /> Start</button>
                <button onClick={() => handleUpdateStatus(selectedAppointment.id, 'completed')} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-2"><Check className="w-4 h-4" /> Complete</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
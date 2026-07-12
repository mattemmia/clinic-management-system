import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Link } from 'react-router-dom'
import EmailVerificationStatus from '../../components/EmailVerificationStatus'
import { FaCalendar, FaPills, FaCalendarDay, FaFileLines, FaPlus, FaHashtag } from 'react-icons/fa6'
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore'
import { db } from '../../firebase/config'

export default function Doctor() {
  const { currentUser, userRole } = useAuth()
  const [stats, setStats] = useState({ todayAppointments: 0, waitingPatients: 0, weeklyPrescriptions: 0, loading: true })
  const [doctorName, setDoctorName] = useState('')

  useEffect(() => {
    if (!currentUser) return
    const fetchDoctorName = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 800))
        const userDocRef = doc(db, 'staffData', currentUser.uid)
        const userDoc = await getDoc(userDocRef)
        if (userDoc.exists()) {
          setDoctorName(userDoc.data().fullName || currentUser.displayName || 'Doctor')
        } else {
          setDoctorName(currentUser.displayName || 'Doctor')
        }
      } catch (error) {
        setDoctorName(currentUser.displayName || 'Doctor')
      }
    }
    fetchDoctorName()
  }, [currentUser])

  useEffect(() => {
    if (!doctorName || !currentUser) return
    const today = new Date().toISOString().split('T')[0]
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - 7)
    let unsubscribeToday = () => { }, unsubscribeWaiting = () => { }, unsubscribeWeekly = () => { }

    const setupListeners = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000))
        const appointmentsRef = collection(db, 'appointments')
        const todayQuery = query(appointmentsRef, where('appointmentDate', '==', today), where('doctorId', '==', currentUser.uid))
        const waitingQuery = query(appointmentsRef, where('appointmentDate', '==', today), where('doctorId', '==', currentUser.uid), where('status', 'in', ['token_generated', 'in_progress']))
        const prescriptionsRef = collection(db, 'prescriptions')
        const weeklyQuery = query(prescriptionsRef, where('doctorId', '==', currentUser.uid))

        unsubscribeToday = onSnapshot(todayQuery, (s) => setStats(p => ({ ...p, todayAppointments: s.docs.length })))
        unsubscribeWaiting = onSnapshot(waitingQuery, (s) => setStats(p => ({ ...p, waitingPatients: s.docs.filter(d => ['token_generated', 'in_progress'].includes(d.data().status)).length })))
        unsubscribeWeekly = onSnapshot(weeklyQuery, (s) => {
          const count = s.docs.filter(d => { const data = d.data(); if (!data.createdAt) return false; const dt = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt); return dt >= weekStart }).length
          setStats(p => ({ ...p, weeklyPrescriptions: count, loading: false }))
        })
      } catch { setStats(p => ({ ...p, loading: false })) }
    }
    setupListeners()
    return () => { unsubscribeToday(); unsubscribeWaiting(); unsubscribeWeekly() }
  }, [doctorName, currentUser])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#030712] transition-colors duration-300">
      <main className="max-w-7xl mx-auto p-6">

        <div className="mb-6">
          <p className="text-gray-500 dark:text-slate-400">Welcome, Dr. {doctorName || '...'}</p>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <Link to="/doctor/appointments" className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 hover:bg-gray-50 dark:hover:bg-slate-800/70 transition-all duration-300 hover:shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <FaCalendar className="w-6 h-6 text-blue-500 dark:text-blue-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Today's Appointments</h3>
              </div>
              <FaCalendarDay className="w-4 h-4 text-blue-500 dark:text-blue-400" />
            </div>
            {stats.loading ? <p className="text-gray-500 dark:text-slate-400">Loading...</p> : <>
              <p className="text-3xl font-bold text-blue-500 dark:text-blue-400">{stats.todayAppointments}</p>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">{stats.todayAppointments === 0 ? 'No appointments today' : stats.todayAppointments === 1 ? 'appointment scheduled' : 'appointments scheduled'}</p>
            </>}
            <p className="text-xs text-blue-500 dark:text-blue-400 mt-2">Click to view all appointments →</p>
          </Link>

          {/* Card 2 */}
          <Link to="/doctor/tokens" className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 hover:bg-gray-50 dark:hover:bg-slate-800/70 transition-all duration-300 hover:shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <FaHashtag className="w-6 h-6 text-yellow-500 dark:text-yellow-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Patient Queue</h3>
              </div>
              <FaHashtag className="w-4 h-4 text-yellow-500 dark:text-yellow-400" />
            </div>
            {stats.loading ? <p className="text-gray-500 dark:text-slate-400">Loading...</p> : <>
              <p className="text-3xl font-bold text-yellow-500 dark:text-yellow-400">{stats.waitingPatients}</p>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">{stats.waitingPatients === 0 ? 'No patients waiting' : stats.waitingPatients === 1 ? 'patient waiting' : 'patients waiting'}</p>
            </>}
            <p className="text-xs text-yellow-500 dark:text-yellow-400 mt-2">Click to view queue →</p>
          </Link>

          {/* Card 3 */}
          <Link to="/doctor/prescriptions" className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 rounded-2xl p-6 hover:bg-gray-50 dark:hover:bg-slate-800/70 transition-all duration-300 hover:shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <FaPills className="w-6 h-6 text-purple-500 dark:text-purple-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Prescriptions</h3>
              </div>
              <FaFileLines className="w-4 h-4 text-purple-500 dark:text-purple-400" />
            </div>
            {stats.loading ? <p className="text-gray-500 dark:text-slate-400">Loading...</p> : <>
              <p className="text-3xl font-bold text-purple-500 dark:text-purple-400">{stats.weeklyPrescriptions}</p>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">{stats.weeklyPrescriptions === 0 ? 'No prescriptions this week' : 'prescriptions this week'}</p>
            </>}
            <p className="text-xs text-purple-500 dark:text-purple-400 mt-2">Click to manage prescriptions →</p>
          </Link>
        </div>

        {/* QUICK ACTIONS */}
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

            <Link to="/doctor/appointments" className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 hover:bg-gray-50 dark:hover:bg-slate-800/70 transition-colors">
              <div className="flex items-center space-x-3"><FaCalendar className="w-5 h-5 text-blue-500 dark:text-blue-400" /><div><h3 className="font-semibold text-gray-900 dark:text-white">View Appointments</h3><p className="text-sm text-gray-500 dark:text-slate-400">Manage patient appointments</p></div></div>
            </Link>

            <Link to="/doctor/prescriptions/create" className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 hover:bg-gray-50 dark:hover:bg-slate-800/70 transition-colors">
              <div className="flex items-center space-x-3"><FaPlus className="w-5 h-5 text-green-500 dark:text-green-400" /><div><h3 className="font-semibold text-gray-900 dark:text-white">New Prescription</h3><p className="text-sm text-gray-500 dark:text-slate-400">Create prescription for patient</p></div></div>
            </Link>

            <Link to="/doctor/prescriptions" className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 rounded-xl p-4 hover:bg-gray-50 dark:hover:bg-slate-800/70 transition-colors">
              <div className="flex items-center space-x-3"><FaFileLines className="w-5 h-5 text-purple-500 dark:text-purple-400" /><div><h3 className="font-semibold text-gray-900 dark:text-white">View Prescriptions</h3><p className="text-sm text-gray-500 dark:text-slate-400">Manage all prescriptions</p></div></div>
            </Link>

            <Link to="/doctor/prescriptions/medicines" className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 hover:bg-gray-50 dark:hover:bg-slate-800/70 transition-colors">
              <div className="flex items-center space-x-3"><FaPills className="w-5 h-5 text-yellow-500 dark:text-yellow-400" /><div><h3 className="font-semibold text-gray-900 dark:text-white">Manage Medicines</h3><p className="text-sm text-gray-500 dark:text-slate-400">Add/edit medicine inventory</p></div></div>
            </Link>

            <Link to="/doctor/tokens" className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 hover:bg-gray-50 dark:hover:bg-slate-800/70 transition-colors">
              <div className="flex items-center space-x-3"><FaHashtag className="w-5 h-5 text-blue-500 dark:text-blue-400" /><div><h3 className="font-semibold text-gray-900 dark:text-white">Patient Queue</h3><p className="text-sm text-gray-500 dark:text-slate-400">View and manage patient tokens</p></div></div>
            </Link>
          </div>
        </div>

        {/* USER INFO */}
        <div className="mt-8 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Account Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><p className="text-gray-500 dark:text-slate-400 text-sm">Email</p><p className="text-gray-900 dark:text-white font-medium">{currentUser?.email}</p></div>
            <div><p className="text-gray-500 dark:text-slate-400 text-sm">Role</p><p className="text-blue-500 dark:text-blue-400 font-medium capitalize">{userRole}</p></div>
            <div><p className="text-gray-500 dark:text-slate-400 text-sm">Full Name</p><p className="text-gray-900 dark:text-white font-medium">Dr. {doctorName}</p></div>
            <div><p className="text-gray-500 dark:text-slate-400 text-sm">Email Verified</p><EmailVerificationStatus /></div>
          </div>
        </div>
      </main>
    </div>
  )
}
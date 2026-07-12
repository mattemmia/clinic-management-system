import { useAuth } from '../../contexts/AuthContext'
import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import EmailVerificationStatus from '../../components/EmailVerificationStatus'
import { Bell, UserPlus, CalendarCheck, Users, Calendar, FileText, FileDown, Hash, DollarSign } from 'lucide-react'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '../../firebase/config'

export default function Receptionist() {
  const { currentUser, userRole } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [todayAppointments, setTodayAppointments] = useState(0)
  const [todayPrescriptions, setTodayPrescriptions] = useState(0)
  const [totalAppointments, setTotalAppointments] = useState(0)

  // Fetch real appointment data
  useEffect(() => {
    const appointmentsRef = collection(db, 'appointments')
    const q = query(appointmentsRef, orderBy('createdAt', 'desc'))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const appointmentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setAppointments(appointmentsData)

      // Calculate today's appointments
      const today = new Date().toISOString().split('T')[0]
      const todayCount = appointmentsData.filter(apt => apt.appointmentDate === today).length
      setTodayAppointments(todayCount)
      setTotalAppointments(appointmentsData.length)
    }, (error) => {
      console.error('Error fetching appointments:', error)
    })

    return () => unsubscribe()
  }, [])

  // Fetch prescription data
  useEffect(() => {
    const prescriptionsRef = collection(db, 'prescriptions')
    const q = query(prescriptionsRef, orderBy('createdAt', 'desc'))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prescriptionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      // Calculate today's prescriptions
      const today = new Date().toISOString().split('T')[0]
      const todayCount = prescriptionsData.filter(pres => pres.prescriptionDate === today).length
      setTodayPrescriptions(todayCount)
    }, (error) => {
      console.error('Error fetching prescriptions:', error)
    })

    return () => unsubscribe()
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#030712] text-slate-900 dark:text-white transition-colors duration-300">

      {/* Page Title */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-cyan-500/10 rounded-xl">
            <Bell className="w-6 h-6 text-cyan-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Receptionist Dashboard</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Welcome, {currentUser?.displayName || 'Receptionist'}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 md:p-6 pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Quick Stats */}
          <Link to="/receptionist/billing" className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 hover:border-cyan-500/30 transition-all cursor-pointer">
            <div className="flex items-center space-x-3 mb-4">
              <DollarSign className="w-6 h-6 text-cyan-500" />
              <h3 className="text-lg font-semibold">Billing & Payments</h3>
            </div>
            <p className="text-3xl font-bold text-cyan-500">{totalAppointments}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Total invoices</p>
            <p className="text-xs text-cyan-500 mt-2">Click to manage billing →</p>
          </Link>

          <Link to="/receptionist/appointments" className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 hover:border-emerald-500/30 transition-all cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <CalendarCheck className="w-6 h-6 text-emerald-500" />
                <h3 className="text-lg font-semibold">Today's Appointments</h3>
              </div>
              <Calendar className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-3xl font-bold text-emerald-500">{todayAppointments}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Scheduled today</p>
            <p className="text-xs text-emerald-500 mt-2">Click to manage appointments →</p>
          </Link>

          <Link to="/receptionist/prescriptions" className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 hover:border-purple-500/30 transition-all cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <FileText className="w-6 h-6 text-purple-500" />
                <h3 className="text-lg font-semibold">Today's Prescriptions</h3>
              </div>
              <FileDown className="w-4 h-4 text-purple-500" />
            </div>
            <p className="text-3xl font-bold text-purple-500">{todayPrescriptions}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Issued today</p>
            <p className="text-xs text-purple-500 mt-2">Click to manage prescriptions →</p>
          </Link>

          <Link to="/receptionist/tokens" className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 hover:border-blue-500/30 transition-all cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Hash className="w-6 h-6 text-blue-500" />
                <h3 className="text-lg font-semibold">Token Management</h3>
              </div>
              <Hash className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-blue-500">{appointments.filter(apt => apt.tokenNumber).length}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Tokens generated today</p>
            <p className="text-xs text-blue-500 mt-2">Click to manage tokens →</p>
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link to="/receptionist/appointments" className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 rounded-xl p-4 hover:border-emerald-500/30 transition-colors">
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-emerald-500" />
                <div>
                  <h3 className="font-semibold">Manage Appointments</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">View and manage appointments</p>
                </div>
              </div>
            </Link>

            <Link to="/receptionist/prescriptions" className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 rounded-xl p-4 hover:border-purple-500/30 transition-colors">
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-purple-500" />
                <div>
                  <h3 className="font-semibold">View Prescriptions</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Manage patient prescriptions</p>
                </div>
              </div>
            </Link>

            <Link to="/receptionist/appointments" className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 rounded-xl p-4 hover:border-cyan-500/30 transition-colors">
              <div className="flex items-center space-x-3">
                <UserPlus className="w-5 h-5 text-cyan-500" />
                <div>
                  <h3 className="font-semibold">Create Appointment</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Schedule new appointment</p>
                </div>
              </div>
            </Link>

            <Link to="/receptionist/tokens" className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 rounded-xl p-4 hover:border-blue-500/30 transition-colors">
              <div className="flex items-center space-x-3">
                <Hash className="w-5 h-5 text-blue-500" />
                <div>
                  <h3 className="font-semibold">Token Management</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Manage patient tokens</p>
                </div>
              </div>
            </Link>

            <Link to="/receptionist/billing" className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 rounded-xl p-4 hover:border-green-500/30 transition-colors">
              <div className="flex items-center space-x-3">
                <DollarSign className="w-5 h-5 text-green-500" />
                <div>
                  <h3 className="font-semibold">Billing & Payments</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Manage invoices and payments</p>
                </div>
              </div>
            </Link>

            <Link to="/receptionist/billing/reports" className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4 hover:border-amber-500/30 transition-colors">
              <div className="flex items-center space-x-3">
                <FileDown className="w-5 h-5 text-amber-500" />
                <div>
                  <h3 className="font-semibold">Download Reports</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Generate and download reports</p>
                </div>
              </div>
            </Link>

            <Link to="/receptionist/billing/create" className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 rounded-xl p-4 hover:border-green-500/30 transition-colors">
              <div className="flex items-center space-x-3">
                <DollarSign className="w-5 h-5 text-green-500" />
                <div>
                  <h3 className="font-semibold">Create Invoice</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Generate new invoice</p>
                </div>
              </div>
            </Link>

            <Link to="/receptionist/billing/payments" className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 rounded-xl p-4 hover:border-purple-500/30 transition-colors">
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-purple-500" />
                <div>
                  <h3 className="font-semibold">Process Payments</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Handle patient payments</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* User Info Card */}
        <div className="mt-8 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-4">Account Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Email</p>
              <p className="font-medium text-slate-900 dark:text-white">{currentUser?.email}</p>
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Role</p>
              <p className="text-cyan-500 font-medium capitalize">{userRole}</p>
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Full Name</p>
              <p className="font-medium text-slate-900 dark:text-white">{currentUser?.displayName}</p>
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Email Verified</p>
              <EmailVerificationStatus />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
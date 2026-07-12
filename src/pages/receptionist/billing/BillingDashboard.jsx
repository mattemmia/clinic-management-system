import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '../../../firebase/config'
import {
  DollarSign,
  FileText,
  CreditCard,
  Banknote,
  Globe,
  TrendingUp,
  Calendar,
  Plus,
  Eye,
  Download
} from 'lucide-react'

export default function BillingDashboard() {
  const [stats, setStats] = useState({
    totalInvoices: 0,
    pendingPayments: 0,
    totalRevenue: 0,
    todayRevenue: 0,
    cashPayments: 0,
    cardPayments: 0,
    onlinePayments: 0
  })
  const [recentInvoices, setRecentInvoices] = useState([])
  const [loading, setLoading] = useState(true)

  const formatNaira = (amount) => {
    return `₦${(amount || 0).toLocaleString('en-NG')}`
  }

  useEffect(() => {
    const invoicesRef = collection(db, 'invoices')
    const invoicesQuery = query(invoicesRef, orderBy('createdAt', 'desc'))

    const unsubscribe = onSnapshot(invoicesQuery, (snapshot) => {
      const invoicesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      // Calculate statistics
      const totalInvoices = invoicesData.length
      const pendingPayments = invoicesData.filter(inv => inv.status === 'pending').length
      const totalRevenue = invoicesData.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0)

      // Today's revenue
      const today = new Date().toISOString().split('T')[0]
      const todayRevenue = invoicesData
        .filter(inv => inv.createdAt?.toDate?.()?.toISOString?.()?.split('T')[0] === today)
        .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0)

      // Payment method breakdown
      const cashPayments = invoicesData
        .filter(inv => inv.paymentMethod === 'cash' && inv.status === 'paid')
        .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0)

      const cardPayments = invoicesData
        .filter(inv => inv.paymentMethod === 'card' && inv.status === 'paid')
        .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0)

      const onlinePayments = invoicesData
        .filter(inv => inv.paymentMethod === 'online' && inv.status === 'paid')
        .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0)

      setStats({
        totalInvoices,
        pendingPayments,
        totalRevenue,
        todayRevenue,
        cashPayments,
        cardPayments,
        onlinePayments
      })

      setRecentInvoices(invoicesData.slice(0, 5))
      setLoading(false)
    }, (error) => {
      console.error('Error fetching billing data:', error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#030712] text-slate-900 dark:text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-500 dark:text-slate-400">Loading billing data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#030712] text-slate-900 dark:text-white transition-colors duration-300">

      {/* Page Title */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-500/10 rounded-xl">
            <DollarSign className="w-6 h-6 text-green-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Billing & Payment</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Manage invoices, payments, and billing</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 md:p-6 pt-0">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <FileText className="w-6 h-6 text-blue-500" />
              <h3 className="text-lg font-semibold">Total Invoices</h3>
            </div>
            <p className="text-3xl font-bold text-blue-500">{stats.totalInvoices}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">All time</p>
          </div>

          <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <DollarSign className="w-6 h-6 text-amber-500" />
              <h3 className="text-lg font-semibold">Pending Payments</h3>
            </div>
            <p className="text-3xl font-bold text-amber-500">{stats.pendingPayments}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Awaiting payment</p>
          </div>

          <div className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <TrendingUp className="w-6 h-6 text-emerald-500" />
              <h3 className="text-lg font-semibold">Total Revenue</h3>
            </div>
            <p className="text-3xl font-bold text-emerald-500">{formatNaira(stats.totalRevenue)}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">All time</p>
          </div>

          <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Calendar className="w-6 h-6 text-purple-500" />
              <h3 className="text-lg font-semibold">Today's Revenue</h3>
            </div>
            <p className="text-3xl font-bold text-purple-500">{formatNaira(stats.todayRevenue)}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Today</p>
          </div>
        </div>

        {/* Payment Methods Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Banknote className="w-6 h-6 text-green-500" />
              <h3 className="text-lg font-semibold">Cash Payments</h3>
            </div>
            <p className="text-2xl font-bold text-green-500">{formatNaira(stats.cashPayments)}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Total cash received</p>
          </div>

          <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <CreditCard className="w-6 h-6 text-blue-500" />
              <h3 className="text-lg font-semibold">Card Payments</h3>
            </div>
            <p className="text-2xl font-bold text-blue-500">{formatNaira(stats.cardPayments)}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Total card payments</p>
          </div>

          <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Globe className="w-6 h-6 text-purple-500" />
              <h3 className="text-lg font-semibold">Online Payments</h3>
            </div>
            <p className="text-2xl font-bold text-purple-500">{formatNaira(stats.onlinePayments)}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Total online payments</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/receptionist/billing/create"
              className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 rounded-xl p-4 hover:border-green-500/30 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Plus className="w-5 h-5 text-green-500" />
                <div>
                  <h3 className="font-semibold">Create Invoice</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Generate new invoice</p>
                </div>
              </div>
            </Link>

            <Link
              to="/receptionist/billing/invoices"
              className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 rounded-xl p-4 hover:border-blue-500/30 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-blue-500" />
                <div>
                  <h3 className="font-semibold">View Invoices</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Manage all invoices</p>
                </div>
              </div>
            </Link>

            <Link
              to="/receptionist/billing/payments"
              className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 rounded-xl p-4 hover:border-purple-500/30 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <CreditCard className="w-5 h-5 text-purple-500" />
                <div>
                  <h3 className="font-semibold">Process Payments</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Handle payments</p>
                </div>
              </div>
            </Link>

            <Link
              to="/receptionist/billing/reports"
              className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4 hover:border-amber-500/30 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Download className="w-5 h-5 text-amber-500" />
                <div>
                  <h3 className="font-semibold">Download Reports</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Generate reports</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Recent Invoices</h2>
            <Link
              to="/receptionist/billing/invoices"
              className="text-blue-500 hover:text-blue-600 text-sm font-medium"
            >
              View All →
            </Link>
          </div>

          {recentInvoices.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400 text-center py-8">No invoices found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800">
                    <th className="text-left py-3 px-4 text-slate-500 dark:text-slate-400 font-medium">Invoice #</th>
                    <th className="text-left py-3 px-4 text-slate-500 dark:text-slate-400 font-medium">Patient</th>
                    <th className="text-left py-3 px-4 text-slate-500 dark:text-slate-400 font-medium">Amount</th>
                    <th className="text-left py-3 px-4 text-slate-500 dark:text-slate-400 font-medium">Status</th>
                    <th className="text-left py-3 px-4 text-slate-500 dark:text-slate-400 font-medium">Date</th>
                    <th className="text-left py-3 px-4 text-slate-500 dark:text-slate-400 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentInvoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b border-slate-100 dark:border-slate-800/50">
                      <td className="py-3 px-4">
                        <span className="font-mono text-blue-500">#{invoice.invoiceNumber}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{invoice.patientName}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">{invoice.patientPhone}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-emerald-500">{formatNaira(invoice.totalAmount)}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${invoice.status === 'paid'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : invoice.status === 'pending'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                          }`}>
                          {invoice.status?.charAt(0).toUpperCase() + invoice.status?.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-500 dark:text-slate-400">
                        {invoice.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <Link
                            to={`/receptionist/billing/invoices/${invoice.id}`}
                            className="text-blue-500 hover:text-blue-600"
                            title="View Invoice"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            to={`/receptionist/billing/invoices/${invoice.id}/download`}
                            className="text-green-500 hover:text-green-600"
                            title="Download PDF"
                          >
                            <Download className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
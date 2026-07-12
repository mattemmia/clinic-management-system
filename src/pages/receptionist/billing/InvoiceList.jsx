import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '../../../firebase/config'
import {
  ArrowLeft,
  Search,
  Filter,
  Eye,
  Download,
  Edit,
  Trash2,
  DollarSign,
  FileText,
  Calendar,
  User,
  Phone,
  CreditCard,
  Banknote,
  Globe,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react'

export default function InvoiceList() {
  const [invoices, setInvoices] = useState([])
  const [filteredInvoices, setFilteredInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [sortBy, setSortBy] = useState('date')
  const [sortOrder, setSortOrder] = useState('desc')

  const formatNaira = (amount) => {
    return `₦${(amount || 0).toLocaleString('en-NG')}`
  }

  useEffect(() => {
    const invoicesRef = collection(db, 'invoices')
    const q = query(invoicesRef, orderBy('createdAt', 'desc'))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const invoicesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setInvoices(invoicesData)
      setFilteredInvoices(invoicesData)
      setLoading(false)
    }, (error) => {
      console.error('Error fetching invoices:', error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Filter and search invoices
  useEffect(() => {
    let filtered = [...invoices]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(invoice =>
        invoice.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.patientPhone?.includes(searchQuery) ||
        invoice.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(invoice => invoice.status === statusFilter)
    }

    // Date filter
    if (dateFilter !== 'all') {
      const today = new Date()
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())

      switch (dateFilter) {
        case 'today': {
          filtered = filtered.filter(invoice => {
            const invoiceDate = invoice.createdAt?.toDate?.() || new Date(invoice.createdAt)
            return invoiceDate >= startOfDay
          })
          break
        }
        case 'week': {
          const weekAgo = new Date(startOfDay.getTime() - 7 * 24 * 60 * 60 * 1000)
          filtered = filtered.filter(invoice => {
            const invoiceDate = invoice.createdAt?.toDate?.() || new Date(invoice.createdAt)
            return invoiceDate >= weekAgo
          })
          break
        }
        case 'month': {
          const monthAgo = new Date(startOfDay.getTime() - 30 * 24 * 60 * 60 * 1000)
          filtered = filtered.filter(invoice => {
            const invoiceDate = invoice.createdAt?.toDate?.() || new Date(invoice.createdAt)
            return invoiceDate >= monthAgo
          })
          break
        }
      }
    }

    // Sort invoices
    filtered.sort((a, b) => {
      let aValue, bValue

      switch (sortBy) {
        case 'date':
          aValue = a.createdAt?.toDate?.() || new Date(a.createdAt)
          bValue = b.createdAt?.toDate?.() || new Date(b.createdAt)
          break
        case 'amount':
          aValue = a.totalAmount || 0
          bValue = b.totalAmount || 0
          break
        case 'name':
          aValue = a.patientName || ''
          bValue = b.patientName || ''
          break
        default:
          aValue = a.createdAt?.toDate?.() || new Date(a.createdAt)
          bValue = b.createdAt?.toDate?.() || new Date(b.createdAt)
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    setFilteredInvoices(filtered)
  }, [invoices, searchQuery, statusFilter, dateFilter, sortBy, sortOrder])

  // Get status icon and color
  const getStatusInfo = (status) => {
    switch (status) {
      case 'paid':
        return { icon: CheckCircle, color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-500/10' }
      case 'pending':
        return { icon: Clock, color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-500/10' }
      case 'overdue':
        return { icon: AlertCircle, color: 'text-rose-600 dark:text-rose-400', bgColor: 'bg-rose-500/10' }
      default:
        return { icon: Clock, color: 'text-slate-600 dark:text-slate-400', bgColor: 'bg-slate-500/10' }
    }
  }

  // Get payment method icon
  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'cash':
        return { icon: Banknote, color: 'text-green-500' }
      case 'card':
        return { icon: CreditCard, color: 'text-blue-500' }
      case 'online':
        return { icon: Globe, color: 'text-purple-500' }
      default:
        return { icon: DollarSign, color: 'text-slate-500' }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#030712] text-slate-900 dark:text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-500 dark:text-slate-400">Loading invoices...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#030712] text-slate-900 dark:text-white transition-colors duration-300">

      {/* Page Title */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <Link
              to="/receptionist/billing"
              className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="p-2 bg-blue-500/10 rounded-xl">
              <FileText className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Invoice Management</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">View and manage all invoices</p>
            </div>
          </div>
          <Link
            to="/receptionist/billing/create"
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Create New Invoice
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 md:p-6 pt-0">
        {/* Filters and Search */}
        <div className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 rounded-2xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by patient name, phone, or invoice number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>

            {/* Date Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Date Range</label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              >
                <option value="date">Date</option>
                <option value="amount">Amount</option>
                <option value="name">Patient Name</option>
              </select>
            </div>
          </div>

          {/* Sort Order Toggle */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-1 bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 rounded-lg text-sm transition-colors"
            >
              {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
            </button>
          </div>
        </div>

        {/* Invoice Count */}
        <div className="mb-4">
          <p className="text-slate-500 dark:text-slate-400">
            Showing {filteredInvoices.length} of {invoices.length} invoices
          </p>
        </div>

        {/* Invoices Table */}
        <div className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 rounded-2xl p-6">
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400 text-lg">No invoices found</p>
              <p className="text-slate-400 dark:text-slate-500 text-sm">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/10">
                    <th className="text-left py-3 px-4 text-slate-500 dark:text-slate-400 font-medium">Invoice #</th>
                    <th className="text-left py-3 px-4 text-slate-500 dark:text-slate-400 font-medium">Patient</th>
                    <th className="text-left py-3 px-4 text-slate-500 dark:text-slate-400 font-medium">Amount</th>
                    <th className="text-left py-3 px-4 text-slate-500 dark:text-slate-400 font-medium">Status</th>
                    <th className="text-left py-3 px-4 text-slate-500 dark:text-slate-400 font-medium">Payment Method</th>
                    <th className="text-left py-3 px-4 text-slate-500 dark:text-slate-400 font-medium">Date</th>
                    <th className="text-left py-3 px-4 text-slate-500 dark:text-slate-400 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((invoice) => {
                    const statusInfo = getStatusInfo(invoice.status)
                    const StatusIcon = statusInfo.icon
                    const paymentMethodInfo = getPaymentMethodIcon(invoice.paymentMethod)
                    const PaymentMethodIcon = paymentMethodInfo.icon

                    return (
                      <tr key={invoice.id} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
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
                          <div className="flex items-center space-x-2">
                            <StatusIcon className={`w-4 h-4 ${statusInfo.color}`} />
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusInfo.bgColor} ${statusInfo.color}`}>
                              {invoice.status?.charAt(0).toUpperCase() + invoice.status?.slice(1)}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {invoice.paymentMethod ? (
                            <div className="flex items-center space-x-2">
                              <PaymentMethodIcon className={`w-4 h-4 ${paymentMethodInfo.color}`} />
                              <span className="text-sm capitalize text-slate-700 dark:text-slate-300">{invoice.paymentMethod}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-sm">Not specified</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-500 dark:text-slate-400">
                          {invoice.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <Link
                              to={`/receptionist/billing/invoices/${invoice.id}`}
                              className="text-blue-500 hover:text-blue-600 p-1 hover:bg-blue-500/10 rounded transition-colors"
                              title="View Invoice"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <Link
                              to={`/receptionist/billing/invoices/${invoice.id}/download`}
                              className="text-green-500 hover:text-green-600 p-1 hover:bg-green-500/10 rounded transition-colors"
                              title="Download PDF"
                            >
                              <Download className="w-4 h-4" />
                            </Link>
                            <Link
                              to={`/receptionist/billing/invoices/${invoice.id}/edit`}
                              className="text-amber-500 hover:text-amber-600 p-1 hover:bg-amber-500/10 rounded transition-colors"
                              title="Edit Invoice"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-6 flex justify-center">
          <div className="flex space-x-4">
            <button
              onClick={() => {
                setSearchQuery('')
                setStatusFilter('all')
                setDateFilter('all')
                setSortBy('date')
                setSortOrder('desc')
              }}
              className="px-4 py-2 bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-900 dark:text-white rounded-lg transition-colors"
            >
              Clear Filters
            </button>
            <Link
              to="/receptionist/billing"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { collection, onSnapshot, query, orderBy, where, updateDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../../firebase/config'
import {
  ArrowLeft,
  Search,
  DollarSign,
  CreditCard,
  Banknote,
  Globe,
  Receipt,
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  Phone,
  Calendar,
  FileText,
  Download,
  Printer
} from 'lucide-react'

export default function PaymentProcessing() {
  const [invoices, setInvoices] = useState([])
  const [filteredInvoices, setFilteredInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [paymentModal, setPaymentModal] = useState(false)
  const [paymentData, setPaymentData] = useState({
    method: 'cash',
    amount: 0,
    reference: '',
    notes: ''
  })
  const [processingPayment, setProcessingPayment] = useState(false)

  const formatNaira = (amount) => {
    return `₦${(amount || 0).toLocaleString('en-NG')}`
  }

  useEffect(() => {
    const invoicesRef = collection(db, 'invoices')
    const q = query(invoicesRef, where('status', 'in', ['pending', 'overdue']), orderBy('createdAt', 'desc'))

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
      toast.error('Error loading invoices')
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Filter invoices based on search
  useEffect(() => {
    if (searchQuery) {
      const filtered = invoices.filter(invoice =>
        invoice.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.patientPhone?.includes(searchQuery) ||
        invoice.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredInvoices(filtered)
    } else {
      setFilteredInvoices(invoices)
    }
  }, [invoices, searchQuery])

  // Open payment modal
  const openPaymentModal = (invoice) => {
    setSelectedInvoice(invoice)
    setPaymentData({
      method: 'cash',
      amount: invoice.totalAmount || 0,
      reference: '',
      notes: ''
    })
    setPaymentModal(true)
  }

  // Process payment
  const processPayment = async () => {
    if (!selectedInvoice || !paymentData.amount || paymentData.amount <= 0) {
      toast.error('Please enter a valid payment amount')
      return
    }

    setProcessingPayment(true)
    try {
      // Update invoice status
      await updateDoc(doc(db, 'invoices', selectedInvoice.id), {
        status: 'paid',
        paymentMethod: paymentData.method,
        paymentDate: serverTimestamp(),
        paymentReference: paymentData.reference,
        paymentNotes: paymentData.notes,
        updatedAt: serverTimestamp()
      })

      // Create payment record
      await addDoc(collection(db, 'payments'), {
        invoiceId: selectedInvoice.id,
        invoiceNumber: selectedInvoice.invoiceNumber,
        patientName: selectedInvoice.patientName,
        patientPhone: selectedInvoice.patientPhone,
        amount: paymentData.amount,
        method: paymentData.method,
        reference: paymentData.reference,
        notes: paymentData.notes,
        processedBy: 'receptionist',
        processedAt: serverTimestamp(),
        status: 'completed'
      })

      toast.success('Payment processed successfully!')
      setPaymentModal(false)
      setSelectedInvoice(null)
      setPaymentData({
        method: 'cash',
        amount: 0,
        reference: '',
        notes: ''
      })
    } catch (error) {
      console.error('Error processing payment:', error)
      toast.error('Error processing payment. Please try again.')
    } finally {
      setProcessingPayment(false)
    }
  }

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

  // Calculate days overdue
  const getDaysOverdue = (invoice) => {
    if (invoice.status === 'paid') return 0

    const dueDate = new Date(invoice.dueDate)
    const today = new Date()
    const diffTime = today - dueDate
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    return diffDays > 0 ? diffDays : 0
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
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-500/10 rounded-xl">
            <DollarSign className="w-6 h-6 text-purple-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Payment Processing</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Process payments for pending invoices</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 md:p-6 pt-0">
        {/* Search */}
        <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 mb-6">
          <div className="max-w-md">
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Search Invoices</label>
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
        </div>

        {/* Invoice Count */}
        <div className="mb-4">
          <p className="text-slate-500 dark:text-slate-400">
            Found {filteredInvoices.length} pending invoices
          </p>
        </div>

        {/* Invoices List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredInvoices.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <DollarSign className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400 text-lg">No pending invoices found</p>
              <p className="text-slate-400 dark:text-slate-500 text-sm">All invoices have been paid</p>
            </div>
          ) : (
            filteredInvoices.map((invoice) => {
              const statusInfo = getStatusInfo(invoice.status)
              const StatusIcon = statusInfo.icon
              const daysOverdue = getDaysOverdue(invoice)

              return (
                <div key={invoice.id} className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 hover:border-blue-500/30 transition-colors">
                  {/* Invoice Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-mono text-blue-500 text-lg">#{invoice.invoiceNumber}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Due: {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <StatusIcon className={`w-4 h-4 ${statusInfo.color}`} />
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusInfo.bgColor} ${statusInfo.color}`}>
                        {invoice.status?.charAt(0).toUpperCase() + invoice.status?.slice(1)}
                      </span>
                    </div>
                  </div>

                  {/* Patient Info */}
                  <div className="mb-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="font-medium text-slate-900 dark:text-white">{invoice.patientName}</span>
                    </div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-500 dark:text-slate-400">{invoice.patientPhone}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        Created: {invoice.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Amount and Overdue Info */}
                  <div className="mb-4">
                    <div className="text-2xl font-bold text-emerald-500 mb-2">
                      {formatNaira(invoice.totalAmount)}
                    </div>
                    {daysOverdue > 0 && (
                      <div className="text-rose-500 text-sm">
                        {daysOverdue} day{daysOverdue > 1 ? 's' : ''} overdue
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openPaymentModal(invoice)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2"
                    >
                      <DollarSign className="w-4 h-4" />
                      <span>Process Payment</span>
                    </button>
                    <Link
                      to={`/receptionist/billing/invoices/${invoice.id}`}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center"
                      title="View Invoice"
                    >
                      <FileText className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </main>

      {/* Payment Modal */}
      {paymentModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#111827] border-slate-200 dark:border-white/10 rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">Process Payment</h2>

            {/* Invoice Summary */}
            <div className="bg-slate-100 dark:bg-white/5 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-600 dark:text-slate-300">Invoice:</span>
                <span className="font-mono text-blue-500">#{selectedInvoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-600 dark:text-slate-300">Patient:</span>
                <span className="font-medium text-slate-900 dark:text-white">{selectedInvoice.patientName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 dark:text-slate-300">Total Amount:</span>
                <span className="text-xl font-bold text-emerald-500">{formatNaira(selectedInvoice.totalAmount)}</span>
              </div>
            </div>

            {/* Payment Method */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'cash', label: 'Cash', icon: Banknote, color: 'text-green-500' },
                  { value: 'card', label: 'Card', icon: CreditCard, color: 'text-blue-500' },
                  { value: 'online', label: 'Online', icon: Globe, color: 'text-purple-500' }
                ].map((method) => {
                  const Icon = method.icon
                  return (
                    <button
                      key={method.value}
                      onClick={() => setPaymentData(prev => ({...prev, method: method.value }))}
                      className={`p-3 rounded-lg border transition-colors ${
                        paymentData.method === method.value
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-slate-200 dark:border-white/10 hover:border-blue-500/30'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${method.color} mx-auto mb-1`} />
                      <span className="text-xs text-slate-700 dark:text-slate-300">{method.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Payment Amount */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Payment Amount (₦)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={paymentData.amount}
                onChange={(e) => setPaymentData(prev => ({...prev, amount: parseFloat(e.target.value) || 0 }))}
                className="w-full px-4 py-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Reference Number */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Reference Number</label>
              <input
                type="text"
                value={paymentData.reference}
                onChange={(e) => setPaymentData(prev => ({...prev, reference: e.target.value }))}
                className="w-full px-4 py-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                placeholder="Transaction ID, receipt number, etc."
              />
            </div>

            {/* Notes */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Notes</label>
              <textarea
                value={paymentData.notes}
                onChange={(e) => setPaymentData(prev => ({...prev, notes: e.target.value }))}
                rows="2"
                className="w-full px-4 py-2 bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                placeholder="Additional payment notes..."
              />
            </div>

            {/* Modal Actions */}
            <div className="flex space-x-3">
              <button
                onClick={() => setPaymentModal(false)}
                className="flex-1 px-4 py-2 bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-900 dark:text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={processPayment}
                disabled={processingPayment}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {processingPayment ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Complete Payment</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
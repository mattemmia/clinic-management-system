import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../../firebase/config'
import {
  ArrowLeft,
  Download,
  Printer,
  FileText,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  Building,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react'

export default function InvoicePdfGenerator() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generatingPdf, setGeneratingPdf] = useState(false)

  const formatNaira = (amount) => {
    return `₦${(amount || 0).toLocaleString('en-NG')}`
  }

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const invoiceDoc = await getDoc(doc(db, 'invoices', id))
        if (invoiceDoc.exists()) {
          setInvoice({ id: invoiceDoc.id, ...invoiceDoc.data() })
        } else {
          toast.error('Invoice not found')
          navigate('/receptionist/billing')
        }
        setLoading(false)
      } catch (error) {
        console.error('Error fetching invoice:', error)
        toast.error('Error fetching invoice')
        setLoading(false)
      }
    }

    if (id) {
      fetchInvoice()
    }
  }, [id, navigate])

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

  // Generate PDF
  const generatePDF = async () => {
    setGeneratingPdf(true)
    try {
      const printWindow = window.open('', '_blank')
      const invoiceHTML = generateInvoiceHTML()

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invoice #${invoice.invoiceNumber}</title>
          <style>
            @media print { body { margin: 0; } .no-print { display: none; } }
            body { font-family: Arial, sans-serif; margin: 20px; color: #333; line-height: 1.6; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .clinic-name { font-size: 24px; font-weight: bold; color: #2563eb; margin-bottom: 5px; }
            .clinic-info { font-size: 14px; color: #666; }
            .invoice-details { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .patient-info, .invoice-info { flex: 1; }
            .section-title { font-size: 16px; font-weight: bold; margin-bottom: 10px; color: #2563eb; }
            .info-row { margin-bottom: 8px; }
            .label { font-weight: bold; color: #555; }
            .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .items-table th, .items-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            .items-table th { background-color: #f8f9fa; font-weight: bold; }
            .amount-column { text-align: right; }
            .summary { margin-top: 30px; text-align: right; }
            .summary-row { margin-bottom: 10px; }
            .total { font-size: 18px; font-weight: bold; color: #059669; border-top: 2px solid #333; padding-top: 10px; }
            .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
            .status-paid { background-color: #dcfce7; color: #059669; }
            .status-pending { background-color: #fef3c7; color: #d97706; }
            .status-overdue { background-color: #fee2e2; color: #dc2626; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 20px; }
            .print-button { background-color: #2563eb; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-size: 16px; margin: 20px 0; }
          </style>
        </head>
        <body>
          ${invoiceHTML}
          <div class="no-print" style="text-align: center;">
            <button class="print-button" onclick="window.print()">Print Invoice</button>
          </div>
        </body>
        </html>
      `)

      printWindow.document.close()
      printWindow.onload = () => {
        printWindow.print()
      }

    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Error generating PDF. Please try again.')
    } finally {
      setGeneratingPdf(false)
    }
  }

  // Generate invoice HTML content
  const generateInvoiceHTML = () => {
    if (!invoice) return ''

    return `
      <div class="header">
        <div class="clinic-name">City Medical Center</div>
        <div class="clinic-info">
          123 Healthcare Avenue, Medical District<br>
          Phone: +234 800 000 0000 | Email: info@citymedical.com<br>
          RC: 1234567
        </div>
      </div>

      <div class="invoice-details">
        <div class="patient-info">
          <div class="section-title">Bill To:</div>
          <div class="info-row"><span class="label">Name:</span> ${invoice.patientName || 'N/A'}</div>
          <div class="info-row"><span class="label">Phone:</span> ${invoice.patientPhone || 'N/A'}</div>
          <div class="info-row"><span class="label">Email:</span> ${invoice.patientEmail || 'N/A'}</div>
          <div class="info-row"><span class="label">Address:</span> ${invoice.patientAddress || 'N/A'}</div>
        </div>

        <div class="invoice-info">
          <div class="section-title">Invoice Details:</div>
          <div class="info-row"><span class="label">Invoice #:</span> ${invoice.invoiceNumber}</div>
          <div class="info-row"><span class="label">Date:</span> ${invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString() : 'N/A'}</div>
          <div class="info-row"><span class="label">Due Date:</span> ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}</div>
          <div class="info-row"><span class="label">Status:</span> 
            <span class="status-badge status-${invoice.status}">${invoice.status?.charAt(0).toUpperCase() + invoice.status?.slice(1)}</span>
          </div>
        </div>
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th>Description</th>
            <th class="amount-column">Quantity</th>
            <th class="amount-column">Unit Price (₦)</th>
            <th class="amount-column">Amount (₦)</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.items?.map(item => `
            <tr>
              <td>${item.description || 'N/A'}</td>
              <td class="amount-column">${item.quantity || 0}</td>
              <td class="amount-column">${(item.unitPrice || 0).toLocaleString('en-NG')}</td>
              <td class="amount-column">${(item.amount || 0).toLocaleString('en-NG')}</td>
            </tr>
          `).join('') || '<tr><td colspan="4" style="text-align: center;">No items</td></tr>'}
        </tbody>
      </table>

      <div class="summary">
        <div class="summary-row"><span class="label">Subtotal:</span> ₦${(invoice.subtotal || 0).toLocaleString('en-NG')}</div>
        <div class="summary-row"><span class="label">Tax (${invoice.taxRate || 0}%):</span> ₦${(invoice.taxAmount || 0).toLocaleString('en-NG')}</div>
        ${invoice.discount > 0 ? `
          <div class="summary-row"><span class="label">Discount:</span> -₦${(invoice.discount || 0).toLocaleString('en-NG')}</div>
        ` : ''}
        <div class="summary-row total"><span class="label">Total Amount:</span> ₦${(invoice.totalAmount || 0).toLocaleString('en-NG')}</div>
      </div>

      ${invoice.notes ? `
        <div style="margin-top: 30px;">
          <div class="section-title">Notes:</div>
          <p>${invoice.notes}</p>
        </div>
      ` : ''}

      <div class="footer">
        <p>Thank you for choosing City Medical Center!</p>
        <p>For any queries, please contact us at +234 800 000 0000</p>
        <p>This is a computer generated invoice and does not require a signature.</p>
      </div>
    `
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#030712] text-slate-900 dark:text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-500 dark:text-slate-400">Loading invoice...</p>
        </div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#030712] text-slate-900 dark:text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 dark:text-slate-400">Invoice not found</p>
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
            <button
              onClick={() => navigate('/receptionist/billing')}
              className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="p-2 bg-green-500/10 rounded-xl">
              <FileText className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Invoice Preview</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">#{invoice.invoiceNumber}</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={generatePDF}
              disabled={generatingPdf}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generatingPdf ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Generate PDF</span>
                </>
              )}
            </button>
            <button
              onClick={() => window.print()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-4 md:p-6 pt-0">
        {/* Invoice Preview */}
        <div className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg overflow-hidden">
          {/* Invoice Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-8 text-center">
            <h1 className="text-3xl font-bold mb-2">City Medical Center</h1>
            <p className="text-blue-100">123 Healthcare Avenue, Medical District</p>
            <p className="text-blue-100">Phone: +234 800 000 0000 | Email: info@citymedical.com</p>
            <p className="text-blue-100 text-sm">RC: 1234567</p>
          </div>

          {/* Invoice Content */}
          <div className="p-8">
            {/* Invoice Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h2 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-4 flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Bill To</span>
                </h2>
                <div className="space-y-2 text-slate-700 dark:text-slate-300">
                  <p><span className="font-medium">Name:</span> {invoice.patientName || 'N/A'}</p>
                  <p><span className="font-medium">Phone:</span> {invoice.patientPhone || 'N/A'}</p>
                  <p><span className="font-medium">Email:</span> {invoice.patientEmail || 'N/A'}</p>
                  <p><span className="font-medium">Address:</span> {invoice.patientAddress || 'N/A'}</p>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-4 flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Invoice Details</span>
                </h2>
                <div className="space-y-2 text-slate-700 dark:text-slate-300">
                  <p><span className="font-medium">Invoice #:</span> <span className="font-mono text-blue-600 dark:text-blue-400">{invoice.invoiceNumber}</span></p>
                  <p><span className="font-medium">Date:</span> {invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString() : 'N/A'}</p>
                  <p><span className="font-medium">Due Date:</span> {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}</p>
                  <p>
                    <span className="font-medium">Status:</span>
                    <span className={`ml-2 px-3 py-1 rounded-full text-xs font-medium ${invoice.status === 'paid'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : invoice.status === 'pending'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      }`}>
                      {invoice.status?.charAt(0).toUpperCase() + invoice.status?.slice(1)}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Invoice Items */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-4">Invoice Items</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border-slate-300 dark:border-slate-700">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-white/5">
                      <th className="border border-slate-300 dark:border-slate-700 px-4 py-3 text-left font-medium">Description</th>
                      <th className="border border-slate-300 dark:border-slate-700 px-4 py-3 text-center font-medium">Quantity</th>
                      <th className="border border-slate-300 dark:border-slate-700 px-4 py-3 text-right font-medium">Unit Price (₦)</th>
                      <th className="border border-slate-300 dark:border-slate-700 px-4 py-3 text-right font-medium">Amount (₦)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items?.map((item, index) => (
                      <tr key={index} className="hover:bg-slate-50 dark:hover:bg-white/5">
                        <td className="border border-slate-300 dark:border-slate-700 px-4 py-3">{item.description || 'N/A'}</td>
                        <td className="border border-slate-300 dark:border-slate-700 px-4 py-3 text-center">{item.quantity || 0}</td>
                        <td className="border border-slate-300 dark:border-slate-700 px-4 py-3 text-right">{formatNaira(item.unitPrice)}</td>
                        <td className="border border-slate-300 dark:border-slate-700 px-4 py-3 text-right font-medium">{formatNaira(item.amount)}</td>
                      </tr>
                    )) || (
                        <tr>
                          <td colSpan="4" className="border border-slate-300 dark:border-slate-700 px-4 py-3 text-center text-slate-500">
                            No items
                          </td>
                        </tr>
                      )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Invoice Summary */}
            <div className="flex justify-end">
              <div className="w-80 space-y-3 text-slate-700 dark:text-slate-300">
                <div className="flex justify-between">
                  <span className="font-medium">Subtotal:</span>
                  <span>{formatNaira(invoice.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Tax ({invoice.taxRate || 0}%):</span>
                  <span>{formatNaira(invoice.taxAmount)}</span>
                </div>
                {invoice.discount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span className="font-medium">Discount:</span>
                    <span>-{formatNaira(invoice.discount)}</span>
                  </div>
                )}
                <div className="border-t border-slate-300 dark:border-slate-700 pt-3">
                  <div className="flex justify-between text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    <span>Total Amount:</span>
                    <span>{formatNaira(invoice.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div className="mt-8 p-4 bg-slate-100 dark:bg-white/5 rounded-lg">
                <h3 className="font-medium text-slate-700 dark:text-slate-300 mb-2">Notes:</h3>
                <p className="text-slate-600 dark:text-slate-400">{invoice.notes}</p>
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 text-center text-slate-500 dark:text-slate-400 text-sm">
              <p>Thank you for choosing City Medical Center!</p>
              <p>For any queries, please contact us at +234 800 000 0000</p>
              <p>This is a computer generated invoice and does not require a signature.</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 flex justify-center space-x-4">
          <button
            onClick={() => navigate('/receptionist/billing')}
            className="px-6 py-3 bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-900 dark:text-white rounded-lg transition-colors"
          >
            Back to Billing
          </button>
          <button
            onClick={() => navigate(`/receptionist/billing/invoices/${invoice.id}`)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            View Invoice Details
          </button>
        </div>
      </main>
    </div>
  )
}
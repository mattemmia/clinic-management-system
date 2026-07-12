import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { collection, addDoc, updateDoc, doc, getDoc, serverTimestamp, query, getDocs, orderBy } from 'firebase/firestore'
import { db } from '../../../firebase/config'
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  User,
  Phone,
  Calendar,
  DollarSign,
  FileText,
  AlertCircle,
  Zap,
  Clock,
  CheckCircle,
  Search,
  Filter,
  X
} from 'lucide-react'

export default function CreateInvoice() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [patients, setPatients] = useState([])
  const [filteredPatients, setFilteredPatients] = useState([])
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [showPatientModal, setShowPatientModal] = useState(false)
  const [patientSearchTerm, setPatientSearchTerm] = useState('')
  const [showQuickServices, setShowQuickServices] = useState(false)

  const formatNaira = (amount) => {
    return `₦${(amount || 0).toLocaleString('en-NG')}`
  }

  const commonServices = [
    { description: 'Consultation Fee', unitPrice: 5000, category: 'consultation' },
    { description: 'Follow-up Consultation', unitPrice: 3000, category: 'consultation' },
    { description: 'Emergency Consultation', unitPrice: 8000, category: 'consultation' },
    { description: 'Blood Test', unitPrice: 4000, category: 'lab' },
    { description: 'X-Ray', unitPrice: 6000, category: 'imaging' },
    { description: 'ECG', unitPrice: 3500, category: 'cardiology' },
    { description: 'Ultrasound', unitPrice: 12000, category: 'imaging' },
    { description: 'Dental Cleaning', unitPrice: 8000, category: 'dental' },
    { description: 'Dental Filling', unitPrice: 15000, category: 'dental' },
    { description: 'Physiotherapy Session', unitPrice: 7000, category: 'therapy' },
    { description: 'Medicine Dispensing', unitPrice: 2000, category: 'pharmacy' },
    { description: 'Suturing', unitPrice: 10000, category: 'procedure' },
    { description: 'Dressing Change', unitPrice: 3000, category: 'procedure' },
    { description: 'Injection', unitPrice: 1500, category: 'procedure' },
    { description: 'Vaccination', unitPrice: 4000, category: 'vaccination' }
  ]

  const [invoiceData, setInvoiceData] = useState({
    patientId: '',
    patientName: '',
    patientPhone: '',
    patientEmail: '',
    patientAddress: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    items: [{ description: '', quantity: 1, unitPrice: 0, amount: 0 }],
    subtotal: 0,
    taxRate: 7.5,
    taxAmount: 0,
    discount: 0,
    totalAmount: 0,
    notes: '',
    terms: 'Payment due within 7 days of invoice date.',
    status: 'pending'
  })

  useEffect(() => {
    fetchPatients()
    if (id) {
      setIsEditing(true)
      loadInvoiceData()
    }
  }, [id])

  useEffect(() => {
    if (patientSearchTerm) {
      const filtered = patients.filter(patient =>
        patient.name?.toLowerCase().includes(patientSearchTerm.toLowerCase()) ||
        patient.phone?.includes(patientSearchTerm) ||
        patient.email?.toLowerCase().includes(patientSearchTerm.toLowerCase())
      )
      setFilteredPatients(filtered)
    } else {
      setFilteredPatients(patients)
    }
  }, [patientSearchTerm, patients])

  const fetchPatients = async () => {
    try {
      const appointmentsRef = collection(db, 'appointments')
      const appointmentsQuery = query(appointmentsRef, orderBy('createdAt', 'desc'))
      const appointmentsSnapshot = await getDocs(appointmentsQuery)

      const uniquePatients = []
      const patientMap = new Map()

      appointmentsSnapshot.docs.forEach(doc => {
        const appointment = doc.data()
        const patientKey = `${appointment.patientName}-${appointment.patientPhone}`

        if (!patientMap.has(patientKey)) {
          patientMap.set(patientKey, {
            id: patientKey,
            name: appointment.patientName,
            age: appointment.patientAge,
            gender: appointment.patientGender,
            phone: appointment.patientPhone,
            email: appointment.patientEmail,
            address: appointment.patientAddress || '',
            lastVisit: appointment.appointmentDate
          })
          uniquePatients.push(patientMap.get(patientKey))
        }
      })

      setPatients(uniquePatients)
      setFilteredPatients(uniquePatients)
    } catch (error) {
      console.error('Error fetching patients:', error)
      const samplePatients = [
        { id: '1', name: 'John Doe', phone: '+234 800 000 0001', email: 'john@example.com', address: '123 Main St, Lagos', age: '35', gender: 'Male', lastVisit: '2024-01-15' },
        { id: '2', name: 'Jane Smith', phone: '+234 800 000 0002', email: 'jane@example.com', address: '456 Oak Ave, Abuja', age: '28', gender: 'Female', lastVisit: '2024-01-20' },
        { id: '3', name: 'Mike Johnson', phone: '+234 800 000 0003', email: 'mike@example.com', address: '789 Pine Rd, Jos', age: '42', gender: 'Male', lastVisit: '2024-01-18' }
      ]
      setPatients(samplePatients)
      setFilteredPatients(samplePatients)
    }
  }

  const loadInvoiceData = useCallback(async () => {
    try {
      const invoiceDoc = await getDoc(doc(db, 'invoices', id))
      if (invoiceDoc.exists()) {
        const data = invoiceDoc.data()
        setInvoiceData({
          ...data,
          invoiceDate: data.invoiceDate ? new Date(data.invoiceDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          dueDate: data.dueDate ? new Date(data.dueDate).toISOString().split('T')[0] : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        })
        if (data.patientId) {
          setSelectedPatient({
            id: data.patientId,
            name: data.patientName,
            phone: data.patientPhone,
            email: data.patientEmail,
            address: data.patientAddress
          })
        }
      }
    } catch (error) {
      console.error('Error loading invoice data:', error)
      toast.error('Error loading invoice data. Please try again.')
    }
  }, [id])

  useEffect(() => {
    const subtotal = invoiceData.items.reduce((sum, item) => sum + (item.amount || 0), 0)
    const taxAmount = (subtotal * invoiceData.taxRate) / 100
    const totalAmount = subtotal + taxAmount - invoiceData.discount
    setInvoiceData(prev => ({ ...prev, subtotal, taxAmount, totalAmount }))
  }, [invoiceData.items, invoiceData.taxRate, invoiceData.discount])

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient)
    setInvoiceData(prev => ({
      ...prev,
      patientId: patient.id,
      patientName: patient.name || '',
      patientPhone: patient.phone || '',
      patientEmail: patient.email || '',
      patientAddress: patient.address || ''
    }))
    setShowPatientModal(false)
    setPatientSearchTerm('')
  }

  const quickAddService = (service) => {
    const newItem = { description: service.description, quantity: 1, unitPrice: service.unitPrice, amount: service.unitPrice }
    setInvoiceData(prev => ({ ...prev, items: [...prev.items, newItem] }))
    setShowQuickServices(false)
  }

  const addCommonServices = (category) => {
    const categoryServices = commonServices.filter(service => service.category === category)
    const newItems = categoryServices.map(service => ({ description: service.description, quantity: 1, unitPrice: service.unitPrice, amount: service.unitPrice }))
    setInvoiceData(prev => ({ ...prev, items: [...prev.items, ...newItems] }))
  }

  const autoFillFromAppointment = () => {
    const appointmentServices = [
      { description: 'Consultation Fee', unitPrice: 5000, quantity: 1 },
      { description: 'Blood Test', unitPrice: 4000, quantity: 1 },
      { description: 'Medicine Dispensing', unitPrice: 2000, quantity: 1 }
    ]
    const newItems = appointmentServices.map(service => ({ ...service, amount: service.unitPrice * service.quantity }))
    setInvoiceData(prev => ({ ...prev, items: newItems }))
  }

  const handleItemChange = (index, field, value) => {
    const newItems = [...invoiceData.items]
    newItems[index] = { ...newItems[index], [field]: value }
    if (field === 'quantity' || field === 'unitPrice') {
      const quantity = field === 'quantity' ? value : newItems[index].quantity
      const unitPrice = field === 'unitPrice' ? value : newItems[index].unitPrice
      newItems[index].amount = quantity * unitPrice
    }
    setInvoiceData(prev => ({ ...prev, items: newItems }))
  }

  const addItem = () => {
    setInvoiceData(prev => ({ ...prev, items: [...prev.items, { description: '', quantity: 1, unitPrice: 0, amount: 0 }] }))
  }

  const removeItem = (index) => {
    if (invoiceData.items.length > 1) {
      const newItems = invoiceData.items.filter((_, i) => i !== index)
      setInvoiceData(prev => ({ ...prev, items: newItems }))
    }
  }

  const clearAllItems = () => {
    setInvoiceData(prev => ({ ...prev, items: [{ description: '', quantity: 1, unitPrice: 0, amount: 0 }] }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!invoiceData.patientName || !invoiceData.patientPhone) {
      toast.error('Please select a patient')
      return
    }

    if (invoiceData.items.some(item => !item.description || item.amount <= 0)) {
      toast.error('Please fill in all item details')
      return
    }

    setLoading(true)
    try {
      if (isEditing) {
        await updateDoc(doc(db, 'invoices', id), { ...invoiceData, updatedAt: serverTimestamp() })
        toast.success('Invoice updated successfully!')
      } else {
        const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`
        await addDoc(collection(db, 'invoices'), { ...invoiceData, invoiceNumber, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
        toast.success('Invoice created successfully!')
      }
      navigate('/receptionist/billing')
    } catch (error) {
      console.error('Error saving invoice:', error)
      toast.error(`Error ${isEditing ? 'updating' : 'creating'} invoice. Please try again.`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#030712] text-slate-900 dark:text-white transition-colors duration-300">

      {/* Page Title */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-6">
        <div className="flex items-center gap-3 mb-6">
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
            <h1 className="text-2xl font-bold">{isEditing ? 'Edit Invoice' : 'Create New Invoice'}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">{isEditing ? 'Modify existing invoice details' : 'Generate invoice for patient services'}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-4 md:p-6 pt-0">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient Information */}
          <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <User className="w-5 h-5 text-cyan-500" />
              <span>Patient Information</span>
            </h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Select Patient *</label>
              <div className="flex space-x-3">
                <button type="button" onClick={() => setShowPatientModal(true)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>Select Patient</span>
                </button>
                {selectedPatient && (
                  <button type="button" onClick={() => setShowPatientModal(true)} className="px-4 py-3 bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-900 dark:text-white rounded-lg transition-colors flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span>Change</span>
                  </button>
                )}
              </div>

              {selectedPatient && (
                <div className="mt-4 p-4 bg-slate-100 dark:bg-white/5 rounded-lg border-slate-200 dark:border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-slate-900 dark:text-white">{selectedPatient.name}</h3>
                      <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">{selectedPatient.age} years, {selectedPatient.gender} • {selectedPatient.phone}</div>
                      {selectedPatient.email && <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">{selectedPatient.email}</div>}
                      {selectedPatient.address && <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">{selectedPatient.address}</div>}
                    </div>
                    <User className="w-6 h-6 text-blue-500" />
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Patient Name *</label>
                <input type="text" required value={invoiceData.patientName} onChange={(e) => setInvoiceData(prev => ({ ...prev, patientName: e.target.value }))} className="w-full px-4 py-2 bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500" placeholder="Enter patient name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Phone Number *</label>
                <input type="tel" required value={invoiceData.patientPhone} onChange={(e) => setInvoiceData(prev => ({ ...prev, patientPhone: e.target.value }))} className="w-full px-4 py-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500" placeholder="Enter phone number" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Email Address</label>
                <input type="email" value={invoiceData.patientEmail} onChange={(e) => setInvoiceData(prev => ({ ...prev, patientEmail: e.target.value }))} className="w-full px-4 py-2 bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500" placeholder="Enter email address" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Address</label>
                <input type="text" value={invoiceData.patientAddress} onChange={(e) => setInvoiceData(prev => ({ ...prev, patientAddress: e.target.value }))} className="w-full px-4 py-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500" placeholder="Enter address" />
              </div>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-purple-500" />
              <span>Invoice Details</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Invoice Date</label>
                <input type="date" value={invoiceData.invoiceDate} onChange={(e) => setInvoiceData(prev => ({ ...prev, invoiceDate: e.target.value }))} className="w-full px-4 py-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Due Date</label>
                <input type="date" value={invoiceData.dueDate} onChange={(e) => setInvoiceData(prev => ({ ...prev, dueDate: e.target.value }))} className="w-full px-4 py-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-500" />
              </div>
            </div>
          </div>

          {/* Quick Service Selection */}
          <div className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold flex items-center space-x-2"><Zap className="w-5 h-5 text-amber-500" /><span>Quick Service Selection</span></h2>
              <button type="button" onClick={() => setShowQuickServices(!showQuickServices)} className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-2 rounded-lg flex items-center space-x-2 transition-colors">
                <Filter className="w-4 h-4" />
                <span>{showQuickServices ? 'Hide' : 'Show'} Quick Services</span>
              </button>
            </div>

            {showQuickServices && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button type="button" onClick={() => addCommonServices('consultation')} className="bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-600 dark:text-blue-400 px-3 py-2 rounded-lg transition-colors text-sm">+ Consultation</button>
                  <button type="button" onClick={() => addCommonServices('lab')} className="bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-600 dark:text-green-400 px-3 py-2 rounded-lg transition-colors text-sm">+ Lab</button>
                  <button type="button" onClick={() => addCommonServices('imaging')} className="bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-600 dark:text-purple-400 px-3 py-2 rounded-lg transition-colors text-sm">+ Imaging</button>
                  <button type="button" onClick={() => addCommonServices('dental')} className="bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 px-3 py-2 rounded-lg transition-colors text-sm">+ Dental</button>
                </div>
                <div className="flex justify-center">
                  <button type="button" onClick={autoFillFromAppointment} className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg transition-all flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>Auto-fill from Appointment</span>
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
                  {commonServices.map((service, index) => (
                    <button key={index} type="button" onClick={() => quickAddService(service)} className="bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white px-3 py-2 rounded-lg transition-colors text-left">
                      <div className="font-medium text-sm">{service.description}</div>
                      <div className="text-xs text-slate-500">{formatNaira(service.unitPrice)}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Invoice Items */}
          <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold flex items-center space-x-2"><DollarSign className="w-5 h-5 text-emerald-500" /><span>Invoice Items</span></h2>
              <div className="flex space-x-2">
                <button type="button" onClick={clearAllItems} className="bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-600 dark:text-rose-400 px-3 py-2 rounded-lg transition-colors text-sm">Clear All</button>
                <button type="button" onClick={addItem} className="bg-cyan-600 hover:bg-cyan-700 text-white px-3 py-2 rounded-lg flex items-center space-x-2 transition-colors"><Plus className="w-4 h-4" /><span>Add Item</span></button>
              </div>
            </div>

            <div className="space-y-4">
              {invoiceData.items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-4 items-end p-4 bg-slate-100 dark:bg-white/5 rounded-lg border-slate-200 dark:border-white/10">
                  <div className="col-span-6">
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Description *</label>
                    <input type="text" required value={item.description} onChange={(e) => handleItemChange(index, 'description', e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500" placeholder="Service or item description" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Quantity</label>
                    <input type="number" min="1" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)} className="w-full px-3 py-2 bg-white dark:bg-white/10 border-slate-200 dark:border-white/20 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-500" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Unit Price (₦)</label>
                    <input type="number" min="0" step="0.01" value={item.unitPrice} onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 bg-white dark:bg-white/10 border-slate-200 dark:border-white/20 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-500" />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Amount (₦)</label>
                    <div className="px-3 py-2 bg-slate-200 dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-lg text-emerald-600 dark:text-emerald-400 font-medium">{formatNaira(item.amount)}</div>
                  </div>
                  <div className="col-span-1">
                    <button type="button" onClick={() => removeItem(index)} disabled={invoiceData.items.length === 1} className="p-2 text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Remove item"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Invoice Summary */}
          <div className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4">Invoice Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Tax Rate (%)</label>
                  <input type="number" min="0" max="100" step="0.01" value={invoiceData.taxRate} onChange={(e) => setInvoiceData(prev => ({ ...prev, taxRate: parseFloat(e.target.value) || 0 }))} className="w-full px-4 py-2 bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Discount (₦)</label>
                  <input type="number" min="0" step="0.01" value={invoiceData.discount} onChange={(e) => setInvoiceData(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))} className="w-full px-4 py-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Notes</label>
                  <textarea value={invoiceData.notes} onChange={(e) => setInvoiceData(prev => ({ ...prev, notes: e.target.value }))} rows="3" className="w-full px-4 py-2 bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500" placeholder="Additional notes for the invoice..." />
                </div>
              </div>

              <div className="bg-slate-100 dark:bg-white/10 rounded-lg p-4 space-y-3 text-slate-700 dark:text-slate-300">
                <div className="flex justify-between"><span>Subtotal:</span><span className="font-medium">{formatNaira(invoiceData.subtotal)}</span></div>
                <div className="flex justify-between"><span>Tax ({invoiceData.taxRate}%):</span><span className="font-medium">{formatNaira(invoiceData.taxAmount)}</span></div>
                <div className="flex justify-between"><span>Discount:</span><span className="font-medium text-rose-600">-{formatNaira(invoiceData.discount)}</span></div>
                <div className="border-t border-slate-300 dark:border-white/20 pt-3">
                  <div className="flex justify-between text-lg font-bold"><span>Total Amount:</span><span className="text-emerald-600 dark:text-emerald-400">{formatNaira(invoiceData.totalAmount)}</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-center space-x-4">
            <button type="button" onClick={() => navigate('/receptionist/billing')} className="px-6 py-3 bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-900 dark:text-white rounded-lg transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2">
              {loading ? (<><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div><span>{isEditing ? 'Updating...' : 'Creating...'}</span></>) : (<><Save className="w-4 h-4" /><span>{isEditing ? 'Update Invoice' : 'Create Invoice'}</span></>)}
            </button>
          </div>
        </form>
      </main>

      {/* Patient Selection Modal */}
      {showPatientModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111827] border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-white/10">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Select Patient</h2>
              <button onClick={() => { setShowPatientModal(false); setPatientSearchTerm('') }} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6 border-b border-slate-200 dark:border-white/10">
              <input type="text" placeholder="Search patients by name, phone, or email..." value={patientSearchTerm} onChange={(e) => setPatientSearchTerm(e.target.value)} className="w-full px-4 py-3 bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none" autoFocus />
            </div>
            <div className="flex-1 overflow-y-auto max-h-96">
              {filteredPatients.length > 0 ? (
                filteredPatients.map((patient) => (
                  <button key={patient.id} onClick={() => handlePatientSelect(patient)} className="w-full p-4 text-left hover:bg-slate-100 dark:hover:bg-white/10 border-b border-slate-100 dark:border-white/5 last:border-b-0 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium text-slate-900 dark:text-white text-lg">{patient.name}</div>
                        <div className="text-slate-500 dark:text-slate-400 mt-1">{patient.age} years, {patient.gender} • {patient.phone}</div>
                        {patient.email && <div className="text-slate-400 text-sm mt-1">{patient.email}</div>}
                        <div className="text-slate-400 text-sm mt-1">Last visit: {patient.lastVisit}</div>
                      </div>
                      <User className="w-5 h-5 text-blue-500" />
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-8 text-center">
                  <div className="text-slate-500 dark:text-slate-400 text-lg mb-2">{patientSearchTerm ? 'No patients found matching your search.' : 'No patients available.'}</div>
                  <div className="text-slate-400 text-sm">{patientSearchTerm ? 'Try a different search term.' : 'Create appointments first to see patients here.'}</div>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-slate-200 dark:border-white/10 flex justify-end">
              <button onClick={() => { setShowPatientModal(false); setPatientSearchTerm('') }} className="px-6 py-2 border-slate-300 dark:border-white/20 text-slate-900 dark:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
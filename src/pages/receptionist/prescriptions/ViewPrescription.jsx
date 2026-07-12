import { useState, useEffect } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import { Link, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { downloadPrescriptionPDF, openPrescriptionPDF, printPrescriptionPDF } from './PrescriptionPdfGenerator'
import {
  User, Calendar, Clock, Phone, Mail, ArrowLeft, Pill, FileText, Printer, Download, AlertTriangle, CheckCircle
} from 'lucide-react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../../firebase/config'

export default function ReceptionistViewPrescription() {
  const { currentUser: _ } = useAuth()
  const { id } = useParams()
  const [prescription, setPrescription] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPrescription = async () => {
      if (!id) return
      try {
        const prescriptionDoc = await getDoc(doc(db, 'prescriptions', id))
        if (prescriptionDoc.exists()) {
          setPrescription({ id: prescriptionDoc.id, ...prescriptionDoc.data() })
        } else {
          toast.error('Prescription not found')
        }
      } catch (error) {
        console.error('Error fetching prescription:', error)
        toast.error('Error loading prescription')
      } finally {
        setLoading(false)
      }
    }
    fetchPrescription()
  }, [id])

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

  const getTimingLabel = (timing) => {
    switch (timing) {
      case 'before_meal': return 'Before Meal'
      case 'after_meal': return 'After Meal'
      case 'empty_stomach': return 'Empty Stomach'
      case 'bedtime': return 'Bedtime'
      case 'as_needed': return 'As Needed'
      default: return timing
    }
  }

  const handlePrint = () => {
    const success = printPrescriptionPDF(prescription)
    success ? toast.success('Opening print dialog...') : toast.error('Failed to generate print view')
  }

  const handleDownloadPDF = () => {
    const success = downloadPrescriptionPDF(prescription)
    success ? toast.success('PDF download started') : toast.error('Failed to generate PDF')
  }

  const handleViewPDF = () => {
    const success = openPrescriptionPDF(prescription)
    success ? toast.success('Opening PDF in new tab...') : toast.error('Failed to open PDF')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-cyan-400 mx-auto"></div>
          <p className="text-slate-500 dark:text-slate-400 mt-4">Loading prescription...</p>
        </div>
      </div>
    )
  }

  if (!prescription) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400">Prescription not found</p>
          <Link
            to="/receptionist/prescriptions"
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-cyan-600 dark:hover:bg-cyan-700 text-white rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Prescriptions</span>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-6">
        {/* Top Actions */}
        <div className="flex justify-between items-center mb-6">
          <Link
            to="/receptionist/prescriptions"
            className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Prescriptions</span>
          </Link>
          <div className="flex items-center gap-3">
            <button onClick={handleViewPDF} className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white rounded-lg transition-colors">
              <FileText className="w-4 h-4" />
              <span>View PDF</span>
            </button>
            <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-cyan-600 dark:hover:bg-cyan-700 text-white rounded-lg transition-colors">
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
            <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white rounded-lg transition-colors">
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Prescription Header */}
          <div className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">Medical Prescription</h2>
                <p className="text-slate-500 dark:text-slate-400">Prescription ID: {prescription.id}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${getStatusColor(prescription.status)}`}>
                {getStatusIcon(prescription.status)}
                <span className="capitalize">{prescription.status}</span>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500 dark:text-slate-400">Date:</span>
                <span className="ml-2 text-slate-900 dark:text-white">{prescription.prescriptionDate}</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Doctor:</span>
                <span className="ml-2 text-slate-900 dark:text-white">{prescription.doctorName}</span>
              </div>
            </div>
          </div>

          {/* Patient Information */}
          <div className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
              <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span>Patient Information</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><span className="text-slate-500 dark:text-slate-400">Name:</span><span className="ml-2 text-slate-900 dark:text-white font-medium">{prescription.patientName}</span></div>
              <div><span className="text-slate-500 dark:text-slate-400">Age:</span><span className="ml-2 text-slate-900 dark:text-white">{prescription.patientAge} years</span></div>
              <div><span className="text-slate-500 dark:text-slate-400">Gender:</span><span className="ml-2 text-slate-900 dark:text-white">{prescription.patientGender}</span></div>
              <div><span className="text-slate-500 dark:text-slate-400">Phone:</span><span className="ml-2 text-slate-900 dark:text-white">{prescription.patientPhone}</span></div>
              <div className="md:col-span-2"><span className="text-slate-500 dark:text-slate-400">Email:</span><span className="ml-2 text-slate-900 dark:text-white">{prescription.patientEmail}</span></div>
            </div>
          </div>

          {/* Diagnosis and Symptoms */}
          <div className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
              <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              <span>Diagnosis & Symptoms</span>
            </h3>
            <div className="space-y-4">
              {prescription.diagnosis && <div><h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Diagnosis:</h4><p className="text-slate-900 dark:text-white">{prescription.diagnosis}</p></div>}
              {prescription.symptoms && <div><h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Symptoms:</h4><p className="text-slate-900 dark:text-white">{prescription.symptoms}</p></div>}
            </div>
          </div>

          {/* Medicines */}
          <div className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
              <Pill className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span>Prescribed Medicines ({prescription.medicines?.length || 0})</span>
            </h3>

            <div className="space-y-4">
              {prescription.medicines?.map((medicine, index) => (
                <div key={medicine.id || index} className="bg-gray-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium text-lg text-slate-900 dark:text-white">{medicine.name}</h4>
                      <p className="text-slate-500 dark:text-slate-400">{medicine.category}</p>
                    </div>
                    <span className="text-sm text-slate-500 dark:text-slate-400">#{index + 1}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div><span className="text-slate-500 dark:text-slate-400">Dosage:</span><span className="ml-2 text-slate-900 dark:text-white">{medicine.dosage}</span></div>
                    <div><span className="text-slate-500 dark:text-slate-400">Frequency:</span><span className="ml-2 text-slate-900 dark:text-white">{medicine.frequency}</span></div>
                    <div><span className="text-slate-500 dark:text-slate-400">Duration:</span><span className="ml-2 text-slate-900 dark:text-white">{medicine.duration}</span></div>
                    <div><span className="text-slate-500 dark:text-slate-400">Timing:</span><span className="ml-2 text-slate-900 dark:text-white">{getTimingLabel(medicine.timing)}</span></div>
                  </div>

                  {medicine.specialInstructions && (
                    <div className="mt-3">
                      <span className="text-slate-500 dark:text-slate-400 text-sm">Special Instructions:</span>
                      <p className="text-slate-900 dark:text-white text-sm mt-1">{medicine.specialInstructions}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Instructions and Follow-up */}
          <div className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
              <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span>Instructions & Follow-up</span>
            </h3>
            <div className="space-y-4">
              {prescription.instructions && <div><h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">General Instructions:</h4><p className="text-slate-900 dark:text-white">{prescription.instructions}</p></div>}
              {prescription.followUpDate && <div><h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Follow-up Date:</h4><p className="text-slate-900 dark:text-white">{prescription.followUpDate}</p></div>}
              {prescription.notes && <div><h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Additional Notes:</h4><p className="text-slate-900 dark:text-white">{prescription.notes}</p></div>}
            </div>
          </div>

          {/* Prescription Footer */}
          <div className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Prescribed on: {prescription.prescriptionDate}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Doctor: {prescription.doctorName}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500 dark:text-slate-400">Prescription ID</p>
                <p className="text-sm text-slate-900 dark:text-white font-mono">{prescription.id}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
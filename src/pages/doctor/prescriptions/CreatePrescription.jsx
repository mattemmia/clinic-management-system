import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  User, Calendar, Clock, Phone, Mail, Plus, Minus, Save,
  Pill, FileText, Search, AlertTriangle, CheckCircle, X
} from 'lucide-react'
import { collection, addDoc, onSnapshot, query, orderBy, getDocs, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../../firebase/config'

export default function CreatePrescription() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams()
  const medicineDropdownRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [patients, setPatients] = useState([])
  const [medicines, setMedicines] = useState([])
  const [filteredMedicines, setFilteredMedicines] = useState([])
  const [showMedicineDropdown, setShowMedicineDropdown] = useState(false)
  const [showPatientModal, setShowPatientModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [patientSearchTerm, setPatientSearchTerm] = useState('')
  const [filteredPatients, setFilteredPatients] = useState([])

  const [formData, setFormData] = useState({
    patientId: '', patientName: '', patientAge: '', patientGender: '', patientPhone: '', patientEmail: '',
    prescriptionDate: new Date().toISOString().split('T')[0], diagnosis: '', symptoms: '', medicines: [],
    instructions: '', followUpDate: '', status: 'active', notes: ''
  })

  // Fetch prescription/appointment data
  const fetchPrescriptionData = useCallback(async () => {
    if (!id) return
    setInitialLoading(true)
    try {
      const prescriptionRef = doc(db, 'prescriptions', id)
      const prescriptionSnap = await getDoc(prescriptionRef)

      if (prescriptionSnap.exists()) {
        const prescriptionData = prescriptionSnap.data()
        setIsEditMode(true)
        setFormData({
          patientId: prescriptionData.patientId || '', patientName: prescriptionData.patientName || '',
          patientAge: prescriptionData.patientAge || '', patientGender: prescriptionData.patientGender || '',
          patientPhone: prescriptionData.patientPhone || '', patientEmail: prescriptionData.patientEmail || '',
          prescriptionDate: prescriptionData.prescriptionDate || new Date().toISOString().split('T')[0],
          diagnosis: prescriptionData.diagnosis || '', symptoms: prescriptionData.symptoms || '',
          medicines: prescriptionData.medicines || [], instructions: prescriptionData.instructions || '',
          followUpDate: prescriptionData.followUpDate || '', status: prescriptionData.status || 'active', notes: prescriptionData.notes || ''
        })
        toast.success('Prescription data loaded')
      } else {
        const appointmentRef = doc(db, 'appointments', id)
        const appointmentSnap = await getDoc(appointmentRef)
        if (appointmentSnap.exists()) {
          const appointmentData = appointmentSnap.data()
          setIsEditMode(false)
          setFormData(prev => ({
            ...prev,
            patientId: appointmentData.patientId || appointmentSnap.id,
            patientName: appointmentData.patientName || '', patientAge: appointmentData.patientAge || '',
            patientGender: appointmentData.patientGender || '', patientPhone: appointmentData.patientPhone || '',
            patientEmail: appointmentData.patientEmail || '', symptoms: appointmentData.symptoms || '', notes: appointmentData.notes || ''
          }))
          toast.success(`Patient data loaded: ${appointmentData.patientName}`)
        } else {
          toast.error('Prescription or appointment not found')
          navigate('/doctor/prescriptions')
        }
      }
    } catch (error) {
      toast.error('Error loading data')
      navigate('/doctor/prescriptions')
    } finally {
      setInitialLoading(false)
    }
  }, [id, navigate])

  useEffect(() => { if (id) fetchPrescriptionData() }, [id, fetchPrescriptionData])

  // Fetch patients + medicines
  useEffect(() => {
    const fetchData = async () => {
      try {
        const patientsRef = collection(db, 'patients')
        const patientsSnap = await getDocs(query(patientsRef, orderBy('fullName')))
        const patientsList = patientsSnap.docs.map(doc => ({ id: doc.id, name: doc.data().fullName, ...doc.data() }))
        setPatients(patientsList)
        setFilteredPatients(patientsList)

        const medicinesRef = collection(db, 'medicines')
        const unsubscribe = onSnapshot(query(medicinesRef, orderBy('name')), (snapshot) => {
          const medicinesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
          setMedicines(medicinesData)
          setFilteredMedicines(medicinesData)
        })
        return () => unsubscribe()
      } catch (error) {
        toast.error('Error loading data')
      }
    }
    fetchData()
  }, [])

  // Filters
  useEffect(() => {
    setFilteredMedicines(searchTerm ? medicines.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.category?.toLowerCase().includes(searchTerm.toLowerCase())) : medicines)
  }, [searchTerm, medicines])

  useEffect(() => {
    setFilteredPatients(patientSearchTerm ? patients.filter(p => p.name?.toLowerCase().includes(patientSearchTerm.toLowerCase()) || p.phone?.includes(patientSearchTerm) || p.email?.toLowerCase().includes(patientSearchTerm.toLowerCase())) : patients)
  }, [patientSearchTerm, patients])

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (medicineDropdownRef.current && !medicineDropdownRef.current.contains(event.target)) setShowMedicineDropdown(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handlePatientSelect = (patient) => {
    setFormData(prev => ({ ...prev, patientId: patient.id, patientName: patient.name, patientAge: patient.age, patientGender: patient.gender, patientPhone: patient.phone, patientEmail: patient.email }))
    setShowPatientModal(false)
    setPatientSearchTerm('')
    toast.success(`Selected: ${patient.name}`)
  }

  const handleAddMedicine = (medicine) => {
    if (formData.medicines.find(m => m.id === medicine.id)) return toast.error('Medicine already added')
    const newMedicine = { id: medicine.id, name: medicine.name, category: medicine.category, dosage: '', frequency: '', duration: '', timing: 'after_meal', specialInstructions: '' }
    setFormData(prev => ({ ...prev, medicines: [...prev.medicines, newMedicine] }))
    setShowMedicineDropdown(false)
    setSearchTerm('')
    toast.success(`Added ${medicine.name}`)
  }

  const handleRemoveMedicine = (medicineId) => {
    setFormData(prev => ({ ...prev, medicines: prev.medicines.filter(m => m.id !== medicineId) }))
    toast.success('Medicine removed')
  }

  const handleMedicineChange = (medicineId, field, value) => {
    setFormData(prev => ({ ...prev, medicines: prev.medicines.map(m => m.id === medicineId ? { ...m, [field]: value } : m) }))
  }

  const validateForm = () => {
    if (!formData.patientName.trim()) return toast.error('Please select a patient'), false
    if (!formData.diagnosis.trim()) return toast.error('Please enter diagnosis'), false
    if (formData.medicines.length === 0) return toast.error('Please add at least one medicine'), false
    for (const medicine of formData.medicines) {
      if (!medicine.dosage.trim()) return toast.error(`Enter dosage for ${medicine.name}`), false
      if (!medicine.frequency.trim()) return toast.error(`Enter frequency for ${medicine.name}`), false
      if (!medicine.duration.trim()) return toast.error(`Enter duration for ${medicine.name}`), false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    setLoading(true)
    try {
      const prescriptionData = { ...formData, doctorName: currentUser.displayName || 'Unknown Doctor', doctorId: currentUser.uid, updatedAt: serverTimestamp() }
      if (isEditMode) {
        await updateDoc(doc(db, 'prescriptions', id), prescriptionData)
        toast.success('Prescription updated!')
      } else {
        prescriptionData.createdAt = serverTimestamp()
        await addDoc(collection(db, 'prescriptions'), prescriptionData)
        toast.success('Prescription created!')
      }
      navigate('/doctor/prescriptions')
    } catch (error) {
      toast.error(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      {initialLoading ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">Loading prescription data...</p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Page Title */}
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{isEditMode ? 'Edit Prescription' : 'Create Prescription'}</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">{isEditMode ? 'Update prescription details' : id ? 'Create from appointment' : 'Write a new prescription'}</p>
          </div>

          {/* Patient Card */}
          <div className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-900 dark:text-white"><User className="w-5 h-5 text-blue-600 dark:text-blue-400" />Patient Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Select Patient</label>
                <div className="flex gap-2">
                  <input type="text" placeholder="Click to select a patient..." value={formData.patientName} readOnly onClick={() => setShowPatientModal(true)} className="flex-1 px-3 py-2.5 bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none cursor-pointer" />
                  <button type="button" onClick={() => setShowPatientModal(true)} className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"><Search className="w-4 h-4" /><span>Select</span></button>
                </div>
              </div>
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Prescription Date</label><input type="date" value={formData.prescriptionDate} onChange={(e) => setFormData(prev => ({ ...prev, prescriptionDate: e.target.value }))} className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none" /></div>
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Patient Age</label><input type="number" value={formData.patientAge} onChange={(e) => setFormData(prev => ({ ...prev, patientAge: e.target.value }))} className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none" placeholder="Age" /></div>
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Patient Gender</label><select value={formData.patientGender} onChange={(e) => setFormData(prev => ({ ...prev, patientGender: e.target.value }))} className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"><option value="">Select Gender</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></select></div>
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Phone Number</label><input type="tel" value={formData.patientPhone} onChange={(e) => setFormData(prev => ({ ...prev, patientPhone: e.target.value }))} className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none" placeholder="Phone number" /></div>
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email</label><input type="email" value={formData.patientEmail} onChange={(e) => setFormData(prev => ({ ...prev, patientEmail: e.target.value }))} className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none" placeholder="Email address" /></div>
            </div>
          </div>

          {/* Diagnosis Card */}
          <div className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-900 dark:text-white"><AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />Diagnosis & Symptoms</h2>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Diagnosis</label><textarea value={formData.diagnosis} onChange={(e) => setFormData(prev => ({ ...prev, diagnosis: e.target.value }))} className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none" rows="3" placeholder="Enter diagnosis..." /></div>
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Symptoms</label><textarea value={formData.symptoms} onChange={(e) => setFormData(prev => ({ ...prev, symptoms: e.target.value }))} className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none" rows="3" placeholder="Enter symptoms..." /></div>
            </div>
          </div>

          {/* Medicines Card */}
          <div className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-900 dark:text-white"><Pill className="w-5 h-5 text-green-600 dark:text-green-400" />Medicines ({formData.medicines.length})</h2>
              <button type="button" onClick={() => setShowMedicineDropdown(!showMedicineDropdown)} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"><Plus className="w-4 h-4" /><span>Add Medicine</span></button>
            </div>
            {showMedicineDropdown && (
              <div className="mb-4" ref={medicineDropdownRef}>
                <input type="text" placeholder="Search medicines..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 focus:border-green-500 focus:outline-none" autoFocus />
                <div className="mt-2 max-h-60 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl">
                  {filteredMedicines.length > 0 ? filteredMedicines.map((medicine) => (
                    <button key={medicine.id} type="button" onClick={() => handleAddMedicine(medicine)} className="w-full px-4 py-3 text-left hover:bg-slate-100 dark:hover:bg-slate-700 border-b border-slate-100 dark:border-slate-700 last:border-b-0 text-slate-900 dark:text-white">
                      <div className="font-medium">{medicine.name}</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">{medicine.category} • {medicine.strength} • {medicine.form}</div>
                    </button>
                  )) : <div className="px-4 py-3 text-slate-500 text-center">No medicines found</div>}
                </div>
              </div>
            )}
            <div className="space-y-4">
              {formData.medicines.map((medicine) => (
                <div key={medicine.id} className="bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3"><div><h3 className="font-semibold text-slate-900 dark:text-white">{medicine.name}</h3><p className="text-sm text-slate-600 dark:text-slate-400">{medicine.category}</p></div><button type="button" onClick={() => handleRemoveMedicine(medicine.id)} className="text-red-600 hover:text-red-500 p-1"><X className="w-5 h-5" /></button></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    <input type="text" value={medicine.dosage} onChange={(e) => handleMedicineChange(medicine.id, 'dosage', e.target.value)} placeholder="Dosage e.g. 500mg" className="px-2 py-2 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white" />
                    <input type="text" value={medicine.frequency} onChange={(e) => handleMedicineChange(medicine.id, 'frequency', e.target.value)} placeholder="Frequency e.g. 2x daily" className="px-2 py-2 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white" />
                    <input type="text" value={medicine.duration} onChange={(e) => handleMedicineChange(medicine.id, 'duration', e.target.value)} placeholder="Duration e.g. 7 days" className="px-2 py-2 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white" />
                    <select value={medicine.timing} onChange={(e) => handleMedicineChange(medicine.id, 'timing', e.target.value)} className="px-2 py-2 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white"><option value="after_meal">After Meal</option><option value="before_meal">Before Meal</option><option value="bedtime">Bedtime</option></select>
                  </div>
                  <input type="text" value={medicine.specialInstructions} onChange={(e) => handleMedicineChange(medicine.id, 'specialInstructions', e.target.value)} placeholder="Special Instructions" className="w-full mt-3 px-2 py-2 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white" />
                </div>
              ))}
            </div>
          </div>

          {/* Instructions Card */}
          <div className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-900 dark:text-white"><CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />Instructions & Follow-up</h2>
            <div className="space-y-4">
              <textarea value={formData.instructions} onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))} className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none" rows="3" placeholder="General instructions..." />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="date" value={formData.followUpDate} onChange={(e) => setFormData(prev => ({ ...prev, followUpDate: e.target.value }))} className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white" />
                <select value={formData.status} onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))} className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white"><option value="active">Active</option><option value="completed">Completed</option><option value="discontinued">Discontinued</option></select>
              </div>
              <textarea value={formData.notes} onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none" rows="3" placeholder="Additional notes..." />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-4">
            <Link to="/doctor/prescriptions" className="px-6 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">Cancel</Link>
            <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50">
              {loading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <Save className="w-4 h-4" />}
              <span>{loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Prescription' : 'Create Prescription')}</span>
            </button>
          </div>
        </form>
      )}

      {/* Patient Modal */}
      {showPatientModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700"><h2 className="text-xl font-bold text-slate-900 dark:text-white">Select Patient</h2><button onClick={() => { setShowPatientModal(false); setPatientSearchTerm('') }} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white"><X className="w-6 h-6" /></button></div>
            <div className="p-6 border-b border-slate-200 dark:border-slate-700"><input type="text" placeholder="Search patients by name, phone, or email..." value={patientSearchTerm} onChange={(e) => setPatientSearchTerm(e.target.value)} className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none" autoFocus /></div>
            <div className="flex-1 overflow-y-auto max-h-96">
              {filteredPatients.length > 0 ? filteredPatients.map((patient) => (
                <button key={patient.id} onClick={() => handlePatientSelect(patient)} className="w-full p-4 text-left hover:bg-slate-100 dark:hover:bg-slate-700 border-b border-slate-100 dark:border-slate-700 last:border-b-0">
                  <div className="flex justify-between items-start"><div className="flex-1"><div className="font-medium text-slate-900 dark:text-white text-lg">{patient.name}</div><div className="text-slate-600 dark:text-slate-400 mt-1">{patient.age} years, {patient.gender} • {patient.phone}</div>{patient.email && (<div className="text-slate-500 text-sm mt-1">{patient.email}</div>)}</div><div className="text-blue-600 dark:text-blue-400"><User className="w-5 h-5" /></div></div>
                </button>
              )) : <div className="p-8 text-center"><div className="text-slate-600 dark:text-slate-400 text-lg mb-2">{patientSearchTerm ? 'No patients found.' : 'No patients available.'}</div></div>}
            </div>
            <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex justify-end"><button onClick={() => { setShowPatientModal(false); setPatientSearchTerm('') }} className="px-6 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">Cancel</button></div>
          </div>
        </div>
      )}
    </div>
  )
}
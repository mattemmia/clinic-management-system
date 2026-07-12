import { useState, useEffect } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import toast from 'react-hot-toast'
import {
  User, Calendar, Clock, Phone, Mail, Plus, Search,
  Pill, Edit, Trash2, Save, X, Package, Activity
} from 'lucide-react'
import { collection, onSnapshot, query, orderBy, doc, deleteDoc, addDoc, updateDoc } from 'firebase/firestore'
import { db } from '../../../firebase/config'

// Helper for Naira
const formatNaira = (amount) => {
  if (!amount && amount!== 0) return ''
  return `₦${Number(amount).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function Medicines() {
  const { currentUser } = useAuth()
  const [medicines, setMedicines] = useState([])
  const [filteredMedicines, setFilteredMedicines] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [loading, setLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedMedicine, setSelectedMedicine] = useState(null)

  const [formData, setFormData] = useState({
    name: '', category: '', strength: '', form: '', manufacturer: '', description: '',
    sideEffects: '', contraindications: '', dosageInstructions: '', storageInstructions: '',
    price: '', stockQuantity: '', reorderLevel: '', isActive: true
  })

  // Fetch medicines
  useEffect(() => {
    if (!currentUser) return
    setLoading(true)
    const medicinesRef = collection(db, 'medicines')
    const q = query(medicinesRef, orderBy('name', 'asc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const medicinesData = snapshot.docs.map(doc => ({ id: doc.id,...doc.data() }))
      setMedicines(medicinesData)
      setFilteredMedicines(medicinesData)
      setLoading(false)
      if (medicinesData.length > 0) toast.success(`Loaded ${medicinesData.length} medicines`)
      else toast.success('No medicines found')
    }, (error) => {
      toast.error('Error loading medicines')
      setLoading(false)
    })
    return () => unsubscribe()
  }, [currentUser])

  useEffect(() => {
    let filtered = medicines
    if (searchTerm) {
      filtered = filtered.filter(medicine =>
        medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        medicine.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        medicine.manufacturer.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    if (filterCategory!== 'all') filtered = filtered.filter(medicine => medicine.category === filterCategory)
    setFilteredMedicines(filtered)
  }, [medicines, searchTerm, filterCategory])

  const handleCreateMedicine = () => {
    setFormData({ name: '', category: '', strength: '', form: '', manufacturer: '', description: '', sideEffects: '', contraindications: '', dosageInstructions: '', storageInstructions: '', price: '', stockQuantity: '', reorderLevel: '', isActive: true })
    setShowCreateModal(true)
  }

  const handleEditMedicine = (medicine) => {
    setSelectedMedicine(medicine)
    setFormData({
      name: medicine.name || '', category: medicine.category || '', strength: medicine.strength || '', form: medicine.form || '',
      manufacturer: medicine.manufacturer || '', description: medicine.description || '', sideEffects: medicine.sideEffects || '',
      contraindications: medicine.contraindications || '', dosageInstructions: medicine.dosageInstructions || '', storageInstructions: medicine.storageInstructions || '',
      price: medicine.price || '', stockQuantity: medicine.stockQuantity || '', reorderLevel: medicine.reorderLevel || '', isActive: medicine.isActive!== false
    })
    setShowEditModal(true)
  }

  const handleDeleteMedicine = async (medicineId) => {
    if (window.confirm('Delete this medicine? This cannot be undone.')) {
      try {
        await deleteDoc(doc(db, 'medicines', medicineId))
        toast.success('Medicine deleted!')
      } catch (error) {
        toast.error(`Error: ${error.message}`)
      }
    }
  }

  const validateForm = () => {
    if (!formData.name.trim()) return toast.error('Enter medicine name'), false
    if (!formData.category.trim()) return toast.error('Select category'), false
    if (!formData.strength.trim()) return toast.error('Enter strength'), false
    if (!formData.form.trim()) return toast.error('Select form'), false
    if (!formData.manufacturer.trim()) return toast.error('Enter manufacturer'), false
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    setLoading(true)
    try {
      const medicineData = {
      ...formData,
        price: parseFloat(formData.price) || 0,
        stockQuantity: parseInt(formData.stockQuantity) || 0,
        reorderLevel: parseInt(formData.reorderLevel) || 0,
        updatedAt: new Date().toISOString(),
        createdBy: currentUser.uid
      }
      if (showEditModal) {
        await updateDoc(doc(db, 'medicines', selectedMedicine.id), {...medicineData, updatedAt: new Date().toISOString() })
        toast.success('Medicine updated!')
        setShowEditModal(false)
      } else {
        medicineData.createdAt = new Date().toISOString()
        await addDoc(collection(db, 'medicines'), medicineData)
        toast.success('Medicine created!')
        setShowCreateModal(false)
      }
    } catch (error) {
      toast.error(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const getCategoryColor = (category) => {
    switch (category) {
      case 'antibiotics': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-400/10'
      case 'painkillers': return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-400/10'
      case 'vitamins': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-400/10'
      case 'diabetes': return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-400/10'
      case 'cardiology': return 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-400/10'
      default: return 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-400/10'
    }
  }

  const getStockStatus = (quantity, reorderLevel) => {
    if (quantity <= 0) return { color: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-400/10', text: 'Out of Stock' }
    if (quantity <= reorderLevel) return { color: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-400/10', text: 'Low Stock' }
    return { color: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-400/10', text: 'In Stock' }
  }

  const categories = ['antibiotics', 'painkillers', 'vitamins', 'diabetes', 'cardiology', 'dermatology', 'psychiatry', 'respiratory', 'gastroenterology', 'neurology']
  const forms = ['tablet', 'capsule', 'syrup', 'injection', 'cream', 'ointment', 'drops', 'inhaler', 'suppository', 'powder']

  return (
    <div className="p-6">
      {/* Page Title */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Manage Medicines</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">Add, edit, and manage medicine inventory</p>
        </div>
        <button onClick={handleCreateMedicine} className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"><Plus className="w-4 h-4" /><span>Add Medicine</span></button>
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-xl p-6 mb-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex flex-col md:flex-row gap-4 w-full lg:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input type="text" placeholder="Search medicines..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none w-full" />
            </div>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-3 py-2 bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none">
              <option value="all">All Categories</option>
              {categories.map(category => (<option key={category} value={category}>{category.charAt(0).toUpperCase() + category.slice(1)}</option>))}
            </select>
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400">{filteredMedicines.length} of {medicines.length} medicines</div>
        </div>
      </div>

      {/* Medicines Grid */}
      {loading? (
        <div className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
          <p className="text-slate-600 dark:text-slate-400 mt-4">Loading medicines...</p>
        </div>
      ) : filteredMedicines.length === 0? (
        <div className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-xl p-8 text-center">
          <Pill className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">No medicines found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMedicines.map((medicine) => {
            const stockStatus = getStockStatus(medicine.stockQuantity, medicine.reorderLevel)
            return (
              <div key={medicine.id} className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-xl p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{medicine.name}</h3>
                    <p className="text-slate-600 dark:text-slate-400">{medicine.strength} • {medicine.form}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(medicine.category)}`}>{medicine.category}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>{stockStatus.text}</span>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300"><Package className="w-4 h-4 text-slate-400" /><span>{medicine.manufacturer}</span></div>
                  <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300"><Activity className="w-4 h-4 text-slate-400" /><span>Stock: {medicine.stockQuantity || 0}</span></div>
                  {medicine.price!== '' && (<div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300 font-medium"><span>{formatNaira(medicine.price)}</span></div>)}
                </div>
                {medicine.description && (<div className="mb-4"><p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{medicine.description}</p></div>)}
                <div className="flex space-x-2">
                  <button onClick={() => handleEditMedicine(medicine)} className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm flex items-center justify-center space-x-2"><Edit className="w-4 h-4" /><span>Edit</span></button>
                  <button onClick={() => handleDeleteMedicine(medicine.id)} className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{showEditModal? 'Edit Medicine' : 'Add New Medicine'}</h2>
              <button onClick={() => { setShowCreateModal(false); setShowEditModal(false) }} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Medicine Name *</label><input type="text" value={formData.name} onChange={(e) => setFormData(prev => ({...prev, name: e.target.value }))} className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none" placeholder="Enter medicine name" /></div>
                <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Category *</label><select value={formData.category} onChange={(e) => setFormData(prev => ({...prev, category: e.target.value }))} className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"><option value="">Select Category</option>{categories.map(category => (<option key={category} value={category}>{category.charAt(0).toUpperCase() + category.slice(1)}</option>))}</select></div>
                <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Strength *</label><input type="text" value={formData.strength} onChange={(e) => setFormData(prev => ({...prev, strength: e.target.value }))} className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none" placeholder="e.g., 500mg, 10ml" /></div>
                <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Form *</label><select value={formData.form} onChange={(e) => setFormData(prev => ({...prev, form: e.target.value }))} className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"><option value="">Select Form</option>{forms.map(form => (<option key={form} value={form}>{form.charAt(0).toUpperCase() + form.slice(1)}</option>))}</select></div>
                <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Manufacturer *</label><input type="text" value={formData.manufacturer} onChange={(e) => setFormData(prev => ({...prev, manufacturer: e.target.value }))} className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none" placeholder="Enter manufacturer name" /></div>
                <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Price ₦</label><input type="number" step="0.01" value={formData.price} onChange={(e) => setFormData(prev => ({...prev, price: e.target.value }))} className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none" placeholder="0.00" /></div>
                <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Stock Quantity</label><input type="number" value={formData.stockQuantity} onChange={(e) => setFormData(prev => ({...prev, stockQuantity: e.target.value }))} className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none" placeholder="0" /></div>
                <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Reorder Level</label><input type="number" value={formData.reorderLevel} onChange={(e) => setFormData(prev => ({...prev, reorderLevel: e.target.value }))} className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none" placeholder="0" /></div>
              </div>

              {/* Description */}
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Description</label><textarea value={formData.description} onChange={(e) => setFormData(prev => ({...prev, description: e.target.value }))} className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none" rows="3" placeholder="Enter medicine description..." /></div>

              {/* Medical Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Side Effects</label><textarea value={formData.sideEffects} onChange={(e) => setFormData(prev => ({...prev, sideEffects: e.target.value }))} className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none" rows="3" placeholder="Common side effects..." /></div>
                <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Contraindications</label><textarea value={formData.contraindications} onChange={(e) => setFormData(prev => ({...prev, contraindications: e.target.value }))} className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none" rows="3" placeholder="Contraindications..." /></div>
              </div>

              {/* Instructions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Dosage Instructions</label><textarea value={formData.dosageInstructions} onChange={(e) => setFormData(prev => ({...prev, dosageInstructions: e.target.value }))} className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none" rows="3" placeholder="Dosage instructions..." /></div>
                <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Storage Instructions</label><textarea value={formData.storageInstructions} onChange={(e) => setFormData(prev => ({...prev, storageInstructions: e.target.value }))} className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none" rows="3" placeholder="Storage instructions..." /></div>
              </div>

              {/* Status */}
              <div><label className="flex items-center space-x-2"><input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData(prev => ({...prev, isActive: e.target.checked }))} className="rounded border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 text-blue-600 focus:ring-blue-500" /><span className="text-sm font-medium text-slate-700 dark:text-slate-300">Active Medicine</span></label></div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button type="button" onClick={() => { setShowCreateModal(false); setShowEditModal(false) }} className="px-6 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">Cancel</button>
                <button type="submit" disabled={loading} className="flex items-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50">
                  {loading? (<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>) : (<Save className="w-4 h-4" />)}
                  <span>{loading? 'Saving...' : (showEditModal? 'Update Medicine' : 'Add Medicine')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
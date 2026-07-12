import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, Stethoscope, UserRound, IdCard, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, AlertCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

export default function Signup() {
  const { role: initialRole } = useParams()
  const navigate = useNavigate()
  const { signup } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [selectedRole, setSelectedRole] = useState(initialRole || 'doctor')
  const [formData, setFormData] = useState({ fullName: '', email: '', password: '', confirmPassword: '' })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const roles = [
    { id: 'doctor', title: 'Doctor', icon: Stethoscope },
    { id: 'receptionist', title: 'Receptionist', icon: UserRound }
  ]

  useEffect(() => { if (initialRole && roles.find(r => r.id === initialRole)) setSelectedRole(initialRole) }, [initialRole])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.fullName.trim()) newErrors.fullName = 'Required'
    if (!formData.email.trim()) newErrors.email = 'Required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid'
    if (formData.password.length < 6) newErrors.password = 'Min 6 chars'
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'No match'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    setIsLoading(true)
    try {
      await signup(formData.email, formData.password, formData.fullName, selectedRole)
      navigate('/verify-email', { state: { role: selectedRole, email: formData.email, fullName: formData.fullName } })
    } catch (error) {
      setErrors(prev => ({ ...prev, general: 'Failed to create account' }))
    } finally { setIsLoading(false) }
  }

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30" />

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full max-w-[420px]">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-10 h-10 bg-emerald-500 rounded-lg mb-3">
            <Activity className="w-5 h-5 text-black" />
          </div>
          <h1 className="text-xl font-semibold text-white tracking-tight">Create Account</h1>
          <p className="text-slate-500 text-sm mt-1">Join ClinicOS</p>
        </div>

        <div className="bg-[#0a0f1a] border-slate-800 rounded-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Switcher */}
            <div className="flex p-1 bg-slate-900 rounded-lg">
              {roles.map(role => (
                <button key={role.id} type="button" onClick={() => setSelectedRole(role.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition ${selectedRole === role.id ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}>
                  <role.icon className="w-4 h-4" /> {role.title}
                </button>
              ))}
            </div>

            {['fullName', 'email', 'password', 'confirmPassword'].map((field, i) => (
              <div key={field}>
                <label className="block text-xs text-slate-400 mb-1.5 capitalize">{field === 'confirmPassword' ? 'Confirm Password' : field.replace('fullName', 'Full Name')}</label>
                <div className="relative">
                  {field === 'fullName' && <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />}
                  {field === 'email' && <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />}
                  {field.includes('password') && <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />}
                  <input
                    type={field.includes('password') ? (field === 'password' ? (showPassword ? 'text' : 'password') : (showConfirmPassword ? 'text' : 'password')) : field === 'email' ? 'email' : 'text'}
                    name={field} value={formData[field]} onChange={handleInputChange}
                    className={`w-full pl-9 pr-9 py-2.5 bg-slate-900 border rounded-lg text-white text-sm placeholder-slate-600 focus:ring-1 focus:ring-emerald-500 outline-none ${errors[field] ? 'border-red-500' : 'border-slate-800 focus:border-emerald-500'}`}
                    placeholder={field === 'fullName' ? 'Dr. John Doe' : field === 'email' ? 'you@clinic.com' : '••••••••'} required
                  />
                  {field.includes('password') && (
                    <button type="button" onClick={() => field === 'password' ? setShowPassword(!showPassword) : setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                      {(field === 'password' ? showPassword : showConfirmPassword) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  )}
                </div>
                {errors[field] && <p className="text-xs text-red-400 mt-1">{errors[field]}</p>}
              </div>
            ))}

            <AnimatePresence>{errors.general && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-red-400 text-xs bg-red-950/40 border-red-900 p-2.5 rounded-lg">
                <AlertCircle className="w-4 h-4" /> {errors.general}
              </motion.div>
            )}</AnimatePresence>

            <button type="submit" disabled={isLoading}
              className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-600 text-black font-semibold rounded-lg transition flex items-center justify-center gap-2 text-sm">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Create Account <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-slate-500">
            Have an account? <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-medium">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
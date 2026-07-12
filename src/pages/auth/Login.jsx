import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, Stethoscope, UserRound, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, AlertCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const { login, userRole, currentUser } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [selectedRole, setSelectedRole] = useState('doctor')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const roles = [
    { id: 'doctor', label: 'Doctor', icon: Stethoscope },
    { id: 'receptionist', label: 'Receptionist', icon: UserRound },
  ]

  useEffect(() => {
    if (currentUser && userRole && selectedRole) {
      if (userRole === selectedRole) {
        navigate(userRole === 'doctor' ? '/doctor' : userRole === 'receptionist' ? '/receptionist' : '/admin')
      } else {
        setError(`Role mismatch. Account is: ${userRole}`)
        setIsLoading(false)
      }
    }
  }, [currentUser, userRole, selectedRole, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedRole || !email || !password) return setError('All fields required')
    setIsLoading(true); setError('')
    try { await login(email, password) }
    catch (error) {
      const map = { 'auth/user-not-found': 'Account not found', 'auth/wrong-password': 'Invalid password', 'auth/invalid-email': 'Invalid email' }
      setError(map[error.code] || 'Sign in failed')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30" />

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full max-w-[400px]">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-10 h-10 bg-emerald-500 rounded-lg mb-3">
            <Activity className="w-5 h-5 text-black" />
          </div>
          <h1 className="text-xl font-semibold text-white tracking-tight">ClinicOS</h1>
          <p className="text-slate-500 text-sm mt-1">Sign in to your workspace</p>
        </div>

        {/* Card */}
        <div className="bg-[#0a0f1a] border border-slate-800 rounded-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Switcher */}
            <div className="flex p-1 bg-slate-900 rounded-lg">
              {roles.map(role => (
                <button key={role.id} type="button" onClick={() => setSelectedRole(role.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition ${selectedRole === role.id ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}>
                  <role.icon className="w-4 h-4" /> {role.label}
                </button>
              ))}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border-slate-800 rounded-lg text-white text-sm placeholder-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  placeholder="you@clinic.com" required />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs text-slate-400">Password</label>
                <Link to="/forgot-password" className="text-xs text-emerald-400 hover:text-emerald-300">Forgot</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-9 py-2.5 bg-slate-900 border-slate-800 rounded-lg text-white text-sm placeholder-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  placeholder="••••" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <AnimatePresence>{error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-red-400 text-xs bg-red-950/40 border border-red-900 p-2.5 rounded-lg">
                <AlertCircle className="w-4 h-4" /> {error}
              </motion.div>
            )}</AnimatePresence>

            <button type="submit" disabled={isLoading}
              className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-600 text-black font-semibold rounded-lg transition flex items-center justify-center gap-2 text-sm">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Sign In <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-slate-500">
            New? <Link to="/signup" className="text-emerald-400 hover:text-emerald-300 font-medium">Create account</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
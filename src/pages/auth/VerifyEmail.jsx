import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FaEnvelope, FaCircleCheck, FaArrowRight, FaClock, FaShieldHalved, FaUserDoctor, FaBellConcierge } from 'react-icons/fa6'

export default function VerifyEmail() {
  const location = useLocation()
  const navigate = useNavigate()
  const [countdown, setCountdown] = useState(20)
  const [isRedirecting, setIsRedirecting] = useState(false)

  const { role, email, fullName } = location.state || { role: 'doctor', email: 'user@example.com', fullName: 'User' }

  const roleMeta = {
    doctor: { title: 'Doctor', icon: FaUserDoctor },
    receptionist: { title: 'Receptionist', icon: FaBellConcierge }
  }

  const currentRole = roleMeta[role] || { title: 'Staff', icon: FaUserDoctor }
  const IconComponent = currentRole.icon

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setIsRedirecting(true)
          setTimeout(() => navigate('/login'), 1000)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [navigate])

  const handleManualRedirect = () => {
    setIsRedirecting(true)
    setTimeout(() => navigate('/login'), 500)
  }

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/10 via-[#020617] to-[#020617]" />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-[420px]"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-500 rounded-lg mb-4">
            <FaEnvelope className="w-5 h-5 text-black" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Verify Your Email</h1>
          <p className="text-slate-500 text-sm mt-1">Check your inbox to continue</p>
        </div>

        {/* Card */}
        <div className="bg-[#0a0f1a] border-slate-800 rounded-xl p-6">

          {/* Success */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-10 h-10 bg-emerald-500/20 rounded-lg mb-3">
              <FaCircleCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-1">Account Created</h2>
            <p className="text-slate-400 text-sm">Welcome, <span className="text-emerald-400 font-medium">{fullName}</span></p>
          </div>

          {/* Role */}
          <div className="bg-slate-900 border-slate-800 rounded-lg p-4 mb-4 flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-800 rounded-lg flex items-center justify-center">
              <IconComponent className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">{currentRole.title}</p>
              <p className="text-xs text-slate-500">Role assigned</p>
            </div>
          </div>

          {/* Email Info */}
          <div className="bg-slate-900 border-slate-800 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <FaEnvelope className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium text-white">Verification sent</span>
            </div>
            <p className="text-xs text-slate-500 mb-2">Link sent to:</p>
            <div className="bg-[#020617] border-slate-800 rounded-md p-2.5 text-center">
              <span className="text-emerald-400 font-mono text-xs break-all">{email}</span>
            </div>
          </div>

          {/* Countdown */}
          <div className="bg-slate-900 border-slate-800 rounded-lg p-4 mb-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FaClock className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-medium text-white">Auto redirect</span>
              </div>
              <span className="text-2xl font-bold text-emerald-400">{countdown}s</span>
            </div>
            <p className="text-xs text-slate-500">Redirecting to login automatically</p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleManualRedirect}
              disabled={isRedirecting}
              className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-600 text-black font-semibold rounded-lg transition flex items-center justify-center gap-2 text-sm"
            >
              {isRedirecting ? (
                <><div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>Redirecting...</>
              ) : (
                <>Go to Login <FaArrowRight className="w-4 h-4" /></>
              )}
            </button>

            <button
              onClick={() => window.location.reload()}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300 font-medium rounded-lg transition text-sm"
            >
              <FaShieldHalved className="w-4 h-4 mr-2 inline" />
              Resend Email
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-[#0a0f1a] border-slate-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Next steps</h3>
          <div className="space-y-2 text-xs text-slate-400">
            <p>1. Check inbox and spam folder</p>
            <p>2. Click verification link</p>
            <p>3. Sign in with your credentials</p>
          </div>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6 flex items-center justify-center gap-1.5">
          <FaShieldHalved className="w-3 h-3" /> Secure verification
        </p>
      </motion.div>
    </div>
  )
}
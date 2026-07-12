import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { CheckCircle, AlertCircle, RefreshCw, Mail, Loader2 } from 'lucide-react'

export default function EmailVerificationStatus() {
  const { currentUser, resendVerificationEmail } = useAuth()
  const [isChecking, setIsChecking] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const handleRefreshStatus = async () => {
    if (!currentUser) return
    setIsChecking(true)
    try {
      await currentUser.reload()
      window.location.reload()
    } catch (error) {
      console.error('Error refreshing verification status:', error)
    } finally {
      setIsChecking(false)
    }
  }

  const handleResendEmail = async () => {
    if (!currentUser) return
    setIsSending(true)
    setEmailSent(false)
    try {
      await resendVerificationEmail()
      setEmailSent(true)
      setTimeout(() => setEmailSent(false), 3000)
    } catch (error) {
      console.error('Error resending verification email:', error)
    } finally {
      setIsSending(false)
    }
  }

  if (!currentUser) return null

  const isVerified = currentUser.emailVerified

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
      <div className="flex items-center gap-2">
        {isVerified ? (
          <CheckCircle className="w-5 h-5 text-emerald-500" />
        ) : (
          <AlertCircle className="w-5 h-5 text-rose-500" />
        )}
        <span className={`text-sm font-semibold ${isVerified ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
          {isVerified ? 'Email Verified' : 'Email Not Verified'}
        </span>
      </div>

      {!isVerified && (
        <div className="flex gap-2">
          <button
            onClick={handleRefreshStatus}
            disabled={isChecking}
            className="text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
          >
            {isChecking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            <span>{isChecking ? 'Checking...' : 'Check Again'}</span>
          </button>

          <button
            onClick={handleResendEmail}
            disabled={isSending}
            className="text-xs bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
          >
            {isSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
            <span>{isSending ? 'Sending...' : 'Resend Email'}</span>
          </button>
        </div>
      )}

      {emailSent && (
        <div className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border-emerald-500/20">
          ✓ Verification email sent!
        </div>
      )}
    </div>
  )
}
import { useState, useEffect } from 'react'
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore'
import { db } from '../firebase/config'
import { Hash, Clock, User, Users, Loader2 } from 'lucide-react'

export default function TokenDisplay() {
  const [currentToken, setCurrentToken] = useState(null)
  const [nextToken, setNextToken] = useState(null)
  const [waitingCount, setWaitingCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    setLoading(true)
    const appointmentsRef = collection(db, 'appointments')
    const q = query(
      appointmentsRef,
      where('appointmentDate', '==', selectedDate),
      where('status', 'in', ['token_generated', 'in_progress']),
      orderBy('tokenNumber', 'asc') // do sorting in DB, faster
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const appointmentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      const current = appointmentsData.find(apt => apt.status === 'in_progress')
      const next = appointmentsData.find(apt => apt.status === 'token_generated')
      const waiting = appointmentsData.filter(apt => apt.status === 'token_generated').length

      setCurrentToken(current || null)
      setNextToken(next || null)
      setWaitingCount(waiting)
      setLoading(false)
    }, (error) => {
      console.error('Error fetching appointments:', error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [selectedDate])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#030712] text-slate-900 dark:text-white flex items-center justify-center">
        <Loader2 className="w-16 h-16 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#030712] text-slate-900 dark:text-white p-4 md:p-8 transition-colors duration-300">

      {/* Header */}
      <header className="max-w-5xl mx-auto text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="p-3 bg-blue-500/10 dark:bg-blue-500/20 rounded-2xl border border-blue-500/20 dark:border-blue-400/30">
            <Hash className="w-8 h-8 text-blue-500 dark:text-blue-400" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
            Patient Queue
          </h1>
        </div>
        <p className="text-slate-500 dark:text-slate-400">
          {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </header>

      {/* Main Grid */}
      <main className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Current Token */}
        <div className="bg-white dark:bg-gradient-to-br dark:from-emerald-500/20 dark:to-green-500/20 border-slate-200 dark:border-emerald-400/30 rounded-3xl p-8 backdrop-blur-2xl shadow-lg dark:shadow-2xl">
          <h2 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />Now Serving
          </h2>
          {currentToken ? (
            <>
              <div className="w-40 h-40 bg-emerald-500/10 dark:bg-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-emerald-500/20 dark:border-emerald-400/50">
                <span className="text-7xl font-black text-emerald-600 dark:text-emerald-400">{currentToken.tokenNumber}</span>
              </div>
              <h3 className="text-3xl font-bold text-center mb-1 text-slate-900 dark:text-white">{currentToken.patientName}</h3>
              <p className="text-center text-slate-600 dark:text-slate-300 flex items-center justify-center gap-2">
                <User className="w-4 h-4" /> {currentToken.patientAge} yrs, {currentToken.patientGender}
              </p>
              <p className="text-center text-slate-500 dark:text-slate-400 mt-2 flex items-center justify-center gap-2">
                <Clock className="w-4 h-4" /> {currentToken.appointmentTime}
              </p>
            </>
          ) : (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">No patient being served</div>
          )}
        </div>

        {/* Next Token */}
        <div className="bg-white dark:bg-gradient-to-br dark:from-blue-500/20 dark:to-purple-500/20 border border-slate-200 dark:border-blue-400/30 rounded-3xl p-8 backdrop-blur-2xl shadow-lg dark:shadow-2xl">
          <h2 className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />Up Next
          </h2>
          {nextToken ? (
            <>
              <div className="w-32 h-32 bg-blue-500/10 dark:bg-blue-500/30 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-blue-500/20 dark:border-blue-400/50">
                <span className="text-5xl font-black text-blue-600 dark:text-blue-400">{nextToken.tokenNumber}</span>
              </div>
              <h3 className="text-2xl font-bold text-center mb-1 text-slate-900 dark:text-white">{nextToken.patientName}</h3>
              <p className="text-center text-slate-600 dark:text-slate-300">{nextToken.patientAge} yrs, {nextToken.patientGender}</p>
              <p className="text-center text-slate-500 dark:text-slate-400 mt-2 flex items-center justify-center gap-2">
                <Clock className="w-4 h-4" /> {nextToken.appointmentTime}
              </p>
            </>
          ) : (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">No next patient</div>
          )}
          {waitingCount > 1 && (
            <div className="mt-4 text-center text-sm text-blue-600 dark:text-blue-300">
              +{waitingCount - 1} more in queue
            </div>
          )}
        </div>

      </main>
    </div>
  )
}
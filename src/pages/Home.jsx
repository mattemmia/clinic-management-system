import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Home() {
  const navigate = useNavigate()
  const appName = import.meta.env.VITE_APP_NAME || 'ClinicOS Management System'
  const redirectDelay = Number(import.meta.env.VITE_REDIRECT_DELAY_MS || 5000)

  useEffect(() => {
    const id = setTimeout(() => navigate('/login'), redirectDelay)
    return () => clearTimeout(id)
  }, [navigate, redirectDelay])

  useEffect(() => {
    document.title = `${appName} — Welcome`
  }, [appName])

  return (
    <div className="min-h-screen w-full grid place-items-center bg-gradient-to-br from-slate-900 to-slate-800 dark:from-[#030712] dark:to-slate-900 text-slate-200 dark:text-white transition-colors duration-500 animate-gradientShift">
      <main className="text-center px-6 py-8 w-[min(560px,92vw)]" role="main" aria-label="Welcome screen">

        {/* Logo Mark */}
        <div className="w-18 h-18 mx-auto mb-4 relative drop-shadow-[0_6px_16px_rgba(34,211,238,0.3)] animate-float">
          <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_50%_50%,#22d3ee,transparent_65%)] opacity-60"></div>
          <div className="absolute inset-0 rounded-2xl bg-[conic-gradient(from_0deg,rgba(34,211,238,0.3),rgba(34,211,238,0.05),rgba(34,211,238,0.3))] opacity-90 animate-spin [mask:radial-gradient(circle_22px_at_50%_50%,transparent_98%,black_100%)]"></div>
        </div>

        <h1 className="text-[clamp(22px,4vw,32px)] font-bold tracking-tight mb-2 animate-fadeInUp">
          Welcome to {appName}
        </h1>

        <p className="text-slate-400 dark:text-slate-300 text-[clamp(14px,2.4vw,16px)] max-w-[46ch] mx-auto leading-relaxed mb-[18px] animate-fadeInUpDelayed">
          Getting things ready. Please wait shortly…
        </p>

        {/* Loader */}
        <div className="w-11 h-11 mx-auto mt-[18px] rounded-full border-[3px] border-white/25 border-t-accent animate-spin"></div>

        <div className="mt-4 text-xs text-slate-500 dark:text-slate-400 animate-fadeIn">
          Redirecting...
        </div>
      </main>
    </div>
  )
}
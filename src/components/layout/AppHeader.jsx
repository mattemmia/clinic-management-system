import { FaUserDoctor, FaUserNurse, FaArrowLeft, FaHouse } from 'react-icons/fa6'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import ThemeToggle from '../ThemeToggle'
import LogoutButton from '../LogoutButton'

const roleConfig = {
  doctor: {
    icon: FaUserDoctor,
    title: 'Doctor Dashboard',
    backTo: '/doctor'
  },
  receptionist: {
    icon: FaUserNurse,
    title: 'Receptionist Panel',
    backTo: '/receptionist'
  }
}

export default function AppHeader({ role = 'doctor' }) {
  const config = roleConfig[role] || roleConfig.doctor
  const Icon = config.icon
  const navigate = useNavigate()
  const location = useLocation()

  const isDashboard = location.pathname === config.backTo

  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1)
    } else {
      navigate(config.backTo)
    }
  }

  return (
    <header className="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto flex justify-between items-center p-4">

        {/* Left */}
        <div className="flex items-center gap-3">

          {/* Back Button - only shows if not on dashboard */}
          {!isDashboard && (
            <button
              onClick={handleBack}
              className="group flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600
                         hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl
                         shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30
                         transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <FaArrowLeft className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1" />
              <span className="hidden sm:inline text-sm font-medium">Back</span>
            </button>
          )}

          {/* Role Icon + Title - HARDCODED, NO LINK */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">{config.title}</h1>
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          {/* Home Button - ALWAYS SHOWS and goes to /doctor */}
          <Link
            to={config.backTo}
            className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            title="Go to Dashboard"
          >
            <FaHouse className="w-5 h-5 text-slate-700 dark:text-slate-300" />
          </Link>

          <ThemeToggle />
          <LogoutButton />
        </div>
      </div>
    </header>
  )
}
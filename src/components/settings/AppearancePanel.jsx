import { Sun, Moon, Monitor, Contrast, Type } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

export default function AppearancePanel() {
  const { theme, setTheme } = useTheme()

  const themeOptions = [
    {
      id: 'light',
      label: 'Light',
      desc: 'Best for bright rooms and printing',
      icon: Sun
    },
    {
      id: 'dark',
      label: 'Dark',
      desc: 'Best for low-light and night shifts',
      icon: Moon
    },
    {
      id: 'system',
      label: 'System',
      desc: 'Matches your device settings',
      icon: Monitor
    }
  ]

  return (
    <div className="bg-white dark:bg-white/[0.03] border-slate-200 dark:border-white/10 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <Contrast className="w-6 h-6 text-blue-500" />
        <div>
          <h3 className="text-lg font-bold">Appearance</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Customize how ClinicOS looks on your device</p>
        </div>
      </div>

      {/* Theme Selection Cards */}
      <div className="space-y-3 mb-6">
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Theme</label>
        {themeOptions.map(option => (
          <button
            key={option.id}
            onClick={() => setTheme(option.id)}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${theme === option.id
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 hover:border-slate-300 dark:hover:border-white/20'
              }`}
          >
            <option.icon className={`w-6 h-6 ${theme === option.id ? 'text-blue-500' : 'text-slate-500'}`} />
            <div className="flex-1">
              <p className="font-semibold">{option.label}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{option.desc}</p>
            </div>
            {theme === option.id && (
              <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white"></div>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Preview */}
      <div className="p-4 rounded-xl bg-slate-100 dark:bg-black/20 border-slate-200 dark:border-white/10">
        <p className="text-sm font-semibold mb-2">Preview</p>
        <div className="flex gap-2">
          <div className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-600 dark:text-blue-400">Scheduled</div>
          <div className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">Completed</div>
          <div className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-600 dark:text-rose-400">Cancelled</div>
        </div>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-500 mt-4">
        Your preference is saved to this browser and synced to your account.
      </p>
    </div>
  )
}
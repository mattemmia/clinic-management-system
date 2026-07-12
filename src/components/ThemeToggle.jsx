import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const options = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'dark', icon: Moon, label: 'Dark' },
    { value: 'system', icon: Monitor, label: 'System' },
  ]

  return (
    <div className="flex items-center gap-1 p-1 bg-white/5 dark:bg-white/[0.03] rounded-xl border border-slate-200 dark:border-white/10">
      {options.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          title={label}
          className={`p-2 rounded-lg transition-all ${theme === value
              ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
              : 'text-slate-500 dark:text-slate-400 hover:bg-white/10'
            }`}
        >
          <Icon className="w-4 h-4" />
        </button>
      ))}
    </div>
  )
}
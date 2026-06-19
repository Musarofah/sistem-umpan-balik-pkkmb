import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { BarChart3, Brain, Home, Menu, Upload, X, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/',          label: 'Beranda',   icon: Home },
  { to: '/analisis',  label: 'Analisis',  icon: Brain },
  { to: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { to: '/upload',    label: 'Upload CSV',icon: Upload },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { isAuthenticated } = useAuth()

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Brain size={18} className="text-white" />
            </div>
            <div className="leading-tight">
              <p className="font-bold text-slate-800 text-sm font-display">EvaluasiPKKMB</p>
              <p className="text-xs text-slate-400 hidden sm:block">Analisis Sentimen AI</p>
            </div>
          </NavLink>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150
                  ${isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`
                }
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}

            <div className="w-px h-5 bg-slate-200 mx-1" />

            <NavLink
              to={isAuthenticated ? '/admin' : '/admin/login'}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150
                ${isActive
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`
              }
            >
              <ShieldCheck size={16} />
              Admin
            </NavLink>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100"
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden pb-4 space-y-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                  ${isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`
                }
              >
                <Icon size={17} />
                {label}
              </NavLink>
            ))}
            <NavLink
              to={isAuthenticated ? '/admin' : '/admin/login'}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                ${isActive ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-50'}`
              }
            >
              <ShieldCheck size={17} />
              Admin
            </NavLink>
          </div>
        )}
      </div>
    </nav>
  )
}

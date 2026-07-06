import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Toaster } from 'sonner'
import { Logo } from './ui'
import ThemeToggle from './ThemeToggle'
import { getStoredTheme } from '../lib/theme'

function useOnline(): boolean {
  const [online, setOnline] = useState(navigator.onLine)
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])
  return online
}

const navCls = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
    isActive ? 'bg-trail-100 text-trail-800' : 'text-trail-100 hover:bg-trail-800/40'
  }`

export default function Layout() {
  const online = useOnline()
  const location = useLocation()

  return (
    <div className="flex min-h-full flex-col">
      <Toaster position="top-center" theme={getStoredTheme()} richColors closeButton />
      <header className="no-print sticky top-0 z-40 border-b border-trail-800 bg-trail-950 text-white">
        <div className="mx-auto flex max-w-4xl items-center gap-2 px-4 py-3">
          <NavLink to="/" className="flex items-center gap-2 font-extrabold tracking-tight text-white">
            <Logo className="h-7 w-7 text-trail-400" />
            <span className="text-lg">Trailmix</span>
          </NavLink>
          <nav className="ml-auto flex items-center gap-1">
            <NavLink to="/" end className={navCls}>
              Hikes
            </NavLink>
            <NavLink to="/foods" className={navCls}>
              Food
            </NavLink>
            <NavLink to="/about" className={navCls}>
              About
            </NavLink>
          </nav>
          <span
            title={online ? 'Online' : 'Offline, but your plans still work'}
            className={`ml-1 hidden h-2 w-2 rounded-full sm:block ${online ? 'bg-trail-400' : 'bg-amber-400'}`}
          />
          <ThemeToggle />
        </div>
      </header>

      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          className="mx-auto w-full max-w-4xl flex-1 px-4 py-6"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>

      <footer className="no-print border-t border-trail-200 py-6 text-center text-xs text-trail-500">
        Trailmix. Plan your resupply, hike your own hike. Works offline. Not medical advice.
      </footer>
    </div>
  )
}

import { NavLink, Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Logo } from './ui'

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
  return (
    <div className="flex min-h-full flex-col">
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
              Food Library
            </NavLink>
            <NavLink to="/about" className={navCls}>
              About
            </NavLink>
          </nav>
          <span
            title={online ? 'Online' : 'Offline — your plans still work'}
            className={`ml-1 hidden items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold sm:flex ${
              online ? 'bg-trail-800 text-trail-200' : 'bg-amber-500/20 text-amber-200'
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${online ? 'bg-trail-400' : 'bg-amber-400'}`} />
            {online ? 'Online' : 'Offline'}
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6">
        <Outlet />
      </main>

      <footer className="no-print border-t border-trail-200 py-6 text-center text-xs text-trail-500">
        Trailmix — plan your resupply, hike your hike. Works offline. Not medical advice.
      </footer>
    </div>
  )
}

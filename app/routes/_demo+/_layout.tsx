import { Link, Outlet } from '@remix-run/react'

export default function AuthLayout() {
  return (
    <div className="flex h-screen flex-col justify-between">
      <Nav />
      <div className="mt-16 flex-1">
        <Outlet />
      </div>
    </div>
  )
}

function Nav() {
  return (
    <header className="fixed w-full border-b border-slate-200 bg-white backdrop-blur-sm z-10 dark:border-slate-800">
      <nav className="container flex flex-wrap items-center justify-between gap-4 py-3 sm:flex-nowrap md:gap-8">
        <Logo />
      </nav>
    </header>
  )
}

function Logo() {
  return (
    <Link to="/" className="text-base">
      <span className="font-bold">Symphony</span> : Human-in-the-Loop Agent Framework
    </Link>
  )
}

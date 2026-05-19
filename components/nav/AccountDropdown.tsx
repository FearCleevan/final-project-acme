'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BiUser, BiPackage, BiRevision, BiMapPin, BiLogOut } from 'react-icons/bi'
import { useAuthStore, DEMO_EMAIL, DEMO_PASSWORD } from '@/store/authStore'

interface AccountDropdownProps {
  onClose: () => void
}

const inputClass =
  'w-full h-11 px-4 bg-parchment border border-ink-rule rounded-sm text-[14px] font-sans text-ink-iron placeholder:text-ink-soft/50 focus:outline-none focus:border-brass-deep focus:ring-1 focus:ring-brass/20 transition-colors'
const errorInputClass =
  'w-full h-11 px-4 bg-parchment border border-error rounded-sm text-[14px] font-sans text-ink-iron placeholder:text-ink-soft/50 focus:outline-none focus:border-error transition-colors'

const profileLinks = [
  { icon: BiPackage,  label: 'Order history',   href: '/account',            tab: 'orders'    },
  { icon: BiRevision, label: 'Returns',          href: '/account',            tab: 'returns'   },
  { icon: BiMapPin,   label: 'Saved addresses',  href: '/account',            tab: 'addresses' },
  { icon: BiUser,     label: 'Track an order',   href: '/track-order',        tab: null        },
]

export default function AccountDropdown({ onClose }: AccountDropdownProps) {
  const router = useRouter()
  const { isAuthenticated, userName, userEmail, signIn, signOut, orders } = useAuthStore()
  const [tab, setTab] = useState<'signin' | 'create'>('signin')

  const [siEmail, setSiEmail] = useState('')
  const [siPassword, setSiPassword] = useState('')
  const [siErrors, setSiErrors] = useState<{ email?: string; password?: string }>({})

  const [caEmail, setCaEmail] = useState('')
  const [caPassword, setCaPassword] = useState('')
  const [caConfirm, setCaConfirm] = useState('')
  const [caErrors, setCaErrors] = useState<{ email?: string; password?: string; confirm?: string }>({})

  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  useEffect(() => {
    function handler(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    const errs: typeof siErrors = {}
    if (!siEmail.trim()) errs.email = 'Email is required'
    if (!siPassword) errs.password = 'Password is required'
    if (Object.keys(errs).length > 0) { setSiErrors(errs); return }
    signIn(siEmail)
    onClose()
    router.push('/account')
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const errs: typeof caErrors = {}
    if (!caEmail.trim()) errs.email = 'Email is required'
    if (!caPassword) errs.password = 'Password is required'
    else if (caPassword.length < 8) errs.password = 'At least 8 characters'
    if (!caConfirm) errs.confirm = 'Please confirm your password'
    else if (caConfirm !== caPassword) errs.confirm = 'Passwords do not match'
    if (Object.keys(errs).length > 0) { setCaErrors(errs); return }
    signIn(caEmail)
    onClose()
    router.push('/account')
  }

  function handleSignOut() {
    signOut()
    onClose()
    router.push('/')
  }

  const tabBtn = (active: boolean) =>
    `flex-1 py-2.5 text-[12px] font-mono uppercase tracking-eyebrow transition-colors border-b-2 ${
      active ? 'text-ink-charcoal border-brass-deep' : 'text-ink-soft border-transparent hover:text-ink-iron'
    }`

  const fieldLabel = (text: string, htmlFor: string) => (
    <label htmlFor={htmlFor} className="block text-[10px] font-mono uppercase tracking-eyebrow text-ink-soft mb-1.5">
      {text}
    </label>
  )

  const initial = userName ? userName[0].toUpperCase() : '?'
  const pendingOrders = orders.filter(o => o.status === 'Processing' || o.status === 'Shipped').length

  return (
    <div
      ref={panelRef}
      className="fixed left-1/2 -translate-x-1/2 top-20 w-[calc(100vw-32px)] sm:w-75 sm:absolute sm:left-auto sm:translate-x-0 sm:right-0 sm:top-[calc(100%+8px)] bg-parchment border border-ink-rule rounded-sm shadow-search-overlay z-50"
      role="dialog"
      aria-label="Account"
    >
      {isAuthenticated ? (
        /* ── Signed-in profile panel ── */
        <>
          {/* Avatar + name */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-ink-rule">
            <div className="w-10 h-10 rounded-full bg-green-brand flex items-center justify-center text-[#F5F1E6] text-[16px] font-serif font-medium shrink-0">
              {initial}
            </div>
            <div className="min-w-0">
              <p className="font-serif text-[16px] font-medium text-ink-charcoal truncate">{userName}</p>
              <p className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-soft truncate">{userEmail}</p>
            </div>
          </div>

          {/* Quick links */}
          <nav className="py-2" aria-label="Account navigation">
            {profileLinks.map(({ icon: Icon, label, href, tab: accountTab }) => (
              <Link
                key={label}
                href={accountTab ? `${href}?tab=${accountTab}` : href}
                onClick={onClose}
                className="flex items-center gap-3 px-5 py-2.5 text-[14px] font-sans text-ink-iron hover:bg-parchment-2 transition-colors"
              >
                <Icon size={16} className="text-brass-deep shrink-0" />
                <span>{label}</span>
                {label === 'Order history' && pendingOrders > 0 && (
                  <span className="ml-auto text-[10px] font-mono text-brass-deep bg-parchment-2 px-2 py-0.5 rounded-pill">
                    {pendingOrders} active
                  </span>
                )}
              </Link>
            ))}
          </nav>

          {/* View full profile + sign out */}
          <div className="border-t border-ink-rule p-3 flex gap-2">
            <Link
              href="/account"
              onClick={onClose}
              className="flex-1 h-9 flex items-center justify-center rounded-sm bg-green-brand text-[#F5F1E6] text-[12px] font-mono uppercase tracking-eyebrow hover:bg-green-deep transition-colors"
            >
              View profile
            </Link>
            <button
              onClick={handleSignOut}
              className="h-9 px-3 flex items-center gap-1.5 rounded-sm border border-ink-rule text-ink-soft text-[12px] font-mono uppercase tracking-eyebrow hover:border-ink-iron hover:text-ink-iron transition-colors"
              aria-label="Sign out"
            >
              <BiLogOut size={14} />
              Sign out
            </button>
          </div>
        </>
      ) : (
        /* ── Sign-in / Create account ── */
        <>
          <div className="flex border-b border-ink-rule px-4 pt-4">
            <button className={tabBtn(tab === 'signin')} onClick={() => setTab('signin')}>Sign in</button>
            <button className={tabBtn(tab === 'create')} onClick={() => setTab('create')}>Create account</button>
          </div>

          <div className="p-5">
            {tab === 'signin' ? (
              <form onSubmit={handleSignIn} noValidate className="space-y-4">
                <p className="font-serif italic text-[15px] text-ink-soft leading-snug mb-5">
                  Welcome back. We&rsquo;ll keep the lamp lit.
                </p>

                <div>
                  {fieldLabel('Email', 'si-email')}
                  <input id="si-email" type="email" value={siEmail} autoComplete="email"
                    onChange={e => { setSiEmail(e.target.value); setSiErrors(x => ({ ...x, email: undefined })) }}
                    placeholder="you@example.com" className={siErrors.email ? errorInputClass : inputClass} />
                  {siErrors.email && <p className="mt-1 text-[11px] text-error font-sans">{siErrors.email}</p>}
                </div>

                <div>
                  {fieldLabel('Password', 'si-password')}
                  <input id="si-password" type="password" value={siPassword} autoComplete="current-password"
                    onChange={e => { setSiPassword(e.target.value); setSiErrors(x => ({ ...x, password: undefined })) }}
                    placeholder="••••••••" className={siErrors.password ? errorInputClass : inputClass} />
                  {siErrors.password && <p className="mt-1 text-[11px] text-error font-sans">{siErrors.password}</p>}
                </div>

                <button type="submit"
                  className="w-full min-h-12 bg-green-brand text-[#F5F1E6] rounded-btn font-sans text-[14px] font-semibold hover:bg-green-deep hover:shadow-cta-hover hover:-translate-y-px active:translate-y-0 transition-all duration-200">
                  Sign in
                </button>

                {/* Demo hint */}
                <div className="bg-parchment-2 border border-ink-rule rounded-sm px-3 py-2.5">
                  <p className="text-[9px] font-mono uppercase tracking-eyebrow text-ink-soft mb-1">Demo account</p>
                  <p className="font-mono text-[11px] text-ink-iron">{DEMO_EMAIL} / {DEMO_PASSWORD}</p>
                </div>
              </form>
            ) : (
              <form onSubmit={handleCreate} noValidate className="space-y-4">
                <div>
                  {fieldLabel('Email', 'ca-email')}
                  <input id="ca-email" type="email" value={caEmail} autoComplete="email"
                    onChange={e => { setCaEmail(e.target.value); setCaErrors(x => ({ ...x, email: undefined })) }}
                    placeholder="you@example.com" className={caErrors.email ? errorInputClass : inputClass} />
                  {caErrors.email && <p className="mt-1 text-[11px] text-error font-sans">{caErrors.email}</p>}
                </div>

                <div>
                  {fieldLabel('Password', 'ca-password')}
                  <input id="ca-password" type="password" value={caPassword} autoComplete="new-password"
                    onChange={e => { setCaPassword(e.target.value); setCaErrors(x => ({ ...x, password: undefined })) }}
                    placeholder="8+ characters" className={caErrors.password ? errorInputClass : inputClass} />
                  {caErrors.password && <p className="mt-1 text-[11px] text-error font-sans">{caErrors.password}</p>}
                </div>

                <div>
                  {fieldLabel('Confirm password', 'ca-confirm')}
                  <input id="ca-confirm" type="password" value={caConfirm} autoComplete="new-password"
                    onChange={e => { setCaConfirm(e.target.value); setCaErrors(x => ({ ...x, confirm: undefined })) }}
                    placeholder="••••••••" className={caErrors.confirm ? errorInputClass : inputClass} />
                  {caErrors.confirm && <p className="mt-1 text-[11px] text-error font-sans">{caErrors.confirm}</p>}
                </div>

                <button type="submit"
                  className="w-full min-h-12 bg-green-brand text-[#F5F1E6] rounded-btn font-sans text-[14px] font-semibold hover:bg-green-deep hover:shadow-cta-hover hover:-translate-y-px active:translate-y-0 transition-all duration-200">
                  Create account
                </button>
              </form>
            )}
          </div>
        </>
      )}
    </div>
  )
}

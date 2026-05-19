'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'

interface AccountDropdownProps {
  onClose: () => void
}

const inputClass =
  'w-full h-[44px] px-4 bg-parchment border border-ink-rule rounded-sm text-[14px] font-sans text-ink-iron placeholder:text-ink-soft/50 focus:outline-none focus:border-brass-deep focus:ring-1 focus:ring-brass/20 transition-colors'

const errorInputClass =
  'w-full h-[44px] px-4 bg-parchment border border-error rounded-sm text-[14px] font-sans text-ink-iron placeholder:text-ink-soft/50 focus:outline-none focus:border-error transition-colors'

export default function AccountDropdown({ onClose }: AccountDropdownProps) {
  const router = useRouter()
  const signIn = useAuthStore(s => s.signIn)
  const [tab, setTab] = useState<'signin' | 'create'>('signin')

  // Sign-in state
  const [siEmail, setSiEmail] = useState('')
  const [siPassword, setSiPassword] = useState('')
  const [siErrors, setSiErrors] = useState<{ email?: string; password?: string }>({})

  // Create account state
  const [caEmail, setCaEmail] = useState('')
  const [caPassword, setCaPassword] = useState('')
  const [caConfirm, setCaConfirm] = useState('')
  const [caErrors, setCaErrors] = useState<{ email?: string; password?: string; confirm?: string }>({})

  const panelRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  // Close on Escape
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

  const tabBtn = (active: boolean) =>
    `flex-1 py-2.5 text-[12px] font-mono uppercase tracking-eyebrow transition-colors border-b-2 ${
      active
        ? 'text-ink-charcoal border-brass-deep'
        : 'text-ink-soft border-transparent hover:text-ink-iron'
    }`

  const fieldLabel = (text: string, htmlFor: string) => (
    <label htmlFor={htmlFor} className="block text-[10px] font-mono uppercase tracking-eyebrow text-ink-soft mb-1.5">
      {text}
    </label>
  )

  return (
    <div
      ref={panelRef}
      className="fixed left-1/2 -translate-x-1/2 top-20 w-[calc(100vw-32px)] sm:w-[320px] sm:absolute sm:left-auto sm:translate-x-0 sm:right-0 sm:top-[calc(100%+8px)] bg-parchment border border-ink-rule rounded-sm shadow-search-overlay z-50"
      role="dialog"
      aria-label="Account"
    >
      {/* Tabs */}
      <div className="flex border-b border-ink-rule px-4 pt-4">
        <button className={tabBtn(tab === 'signin')} onClick={() => setTab('signin')}>
          Sign in
        </button>
        <button className={tabBtn(tab === 'create')} onClick={() => setTab('create')}>
          Create account
        </button>
      </div>

      <div className="p-5">
        {tab === 'signin' ? (
          <form onSubmit={handleSignIn} noValidate className="space-y-4">
            <p className="font-serif italic text-[15px] text-ink-soft leading-snug mb-5">
              Welcome back. We&rsquo;ll keep the lamp lit.
            </p>

            <div>
              {fieldLabel('Email', 'si-email')}
              <input
                id="si-email" type="email" value={siEmail} autoComplete="email"
                onChange={e => { setSiEmail(e.target.value); if (siErrors.email) setSiErrors(x => ({ ...x, email: undefined })) }}
                placeholder="you@example.com"
                className={siErrors.email ? errorInputClass : inputClass}
              />
              {siErrors.email && <p className="mt-1 text-[11px] text-error font-sans">{siErrors.email}</p>}
            </div>

            <div>
              {fieldLabel('Password', 'si-password')}
              <input
                id="si-password" type="password" value={siPassword} autoComplete="current-password"
                onChange={e => { setSiPassword(e.target.value); if (siErrors.password) setSiErrors(x => ({ ...x, password: undefined })) }}
                placeholder="••••••••"
                className={siErrors.password ? errorInputClass : inputClass}
              />
              {siErrors.password && <p className="mt-1 text-[11px] text-error font-sans">{siErrors.password}</p>}
            </div>

            <button
              type="submit"
              className="w-full min-h-[48px] bg-green-brand text-[#F5F1E6] rounded-btn font-sans text-[14px] font-semibold hover:bg-green-deep hover:shadow-cta-hover hover:-translate-y-px active:translate-y-0 transition-all duration-200 mt-1"
            >
              Sign in
            </button>

            <button type="button" className="w-full text-center text-[10px] font-mono uppercase tracking-eyebrow text-ink-soft hover:text-brass-deep transition-colors pt-1">
              Forgot your password?
            </button>
          </form>
        ) : (
          <form onSubmit={handleCreate} noValidate className="space-y-4">
            <div>
              {fieldLabel('Email', 'ca-email')}
              <input
                id="ca-email" type="email" value={caEmail} autoComplete="email"
                onChange={e => { setCaEmail(e.target.value); if (caErrors.email) setCaErrors(x => ({ ...x, email: undefined })) }}
                placeholder="you@example.com"
                className={caErrors.email ? errorInputClass : inputClass}
              />
              {caErrors.email && <p className="mt-1 text-[11px] text-error font-sans">{caErrors.email}</p>}
            </div>

            <div>
              {fieldLabel('Password', 'ca-password')}
              <input
                id="ca-password" type="password" value={caPassword} autoComplete="new-password"
                onChange={e => { setCaPassword(e.target.value); if (caErrors.password) setCaErrors(x => ({ ...x, password: undefined })) }}
                placeholder="8+ characters"
                className={caErrors.password ? errorInputClass : inputClass}
              />
              {caErrors.password && <p className="mt-1 text-[11px] text-error font-sans">{caErrors.password}</p>}
            </div>

            <div>
              {fieldLabel('Confirm password', 'ca-confirm')}
              <input
                id="ca-confirm" type="password" value={caConfirm} autoComplete="new-password"
                onChange={e => { setCaConfirm(e.target.value); if (caErrors.confirm) setCaErrors(x => ({ ...x, confirm: undefined })) }}
                placeholder="••••••••"
                className={caErrors.confirm ? errorInputClass : inputClass}
              />
              {caErrors.confirm && <p className="mt-1 text-[11px] text-error font-sans">{caErrors.confirm}</p>}
            </div>

            <button
              type="submit"
              className="w-full min-h-[48px] bg-green-brand text-[#F5F1E6] rounded-btn font-sans text-[14px] font-semibold hover:bg-green-deep hover:shadow-cta-hover hover:-translate-y-px active:translate-y-0 transition-all duration-200 mt-1"
            >
              Create account
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

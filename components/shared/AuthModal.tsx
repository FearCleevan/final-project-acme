'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BiX } from 'react-icons/bi'
import { useAuthStore, DEMO_EMAIL, DEMO_PASSWORD } from '@/store/authStore'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  /** Optional hint shown below the form */
  hint?: string
}

const inputClass =
  'w-full h-[44px] px-4 bg-parchment border border-ink-rule rounded-sm text-[14px] font-sans text-ink-iron placeholder:text-ink-soft/50 focus:outline-none focus:border-brass-deep focus:ring-1 focus:ring-brass/20 transition-colors'
const errorInputClass =
  'w-full h-[44px] px-4 bg-parchment border border-error rounded-sm text-[14px] font-sans text-ink-iron placeholder:text-ink-soft/50 focus:outline-none focus:border-error transition-colors'

export default function AuthModal({ isOpen, onClose, onSuccess, hint }: AuthModalProps) {
  const signIn = useAuthStore(s => s.signIn)
  const [tab, setTab] = useState<'signin' | 'create'>('signin')

  const [siEmail, setSiEmail] = useState('')
  const [siPassword, setSiPassword] = useState('')
  const [siErrors, setSiErrors] = useState<{ email?: string; password?: string }>({})

  const [caName, setCaName] = useState('')
  const [caEmail, setCaEmail] = useState('')
  const [caPassword, setCaPassword] = useState('')
  const [caConfirm, setCaConfirm] = useState('')
  const [caErrors, setCaErrors] = useState<{ name?: string; email?: string; password?: string; confirm?: string }>({})

  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  /* Lock body scroll while open */
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    const errs: typeof siErrors = {}
    if (!siEmail.trim()) errs.email = 'Email is required'
    if (!siPassword) errs.password = 'Password is required'
    if (Object.keys(errs).length > 0) { setSiErrors(errs); return }
    signIn(siEmail, undefined)
    onClose()
    onSuccess?.()
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const errs: typeof caErrors = {}
    if (!caName.trim()) errs.name = 'Name is required'
    if (!caEmail.trim()) errs.email = 'Email is required'
    if (!caPassword) errs.password = 'Password is required'
    else if (caPassword.length < 8) errs.password = 'At least 8 characters'
    if (!caConfirm) errs.confirm = 'Please confirm your password'
    else if (caConfirm !== caPassword) errs.confirm = 'Passwords do not match'
    if (Object.keys(errs).length > 0) { setCaErrors(errs); return }
    signIn(caEmail, caName)
    onClose()
    onSuccess?.()
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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Scrim */}
          <motion.div
            key="scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-ink-charcoal/50"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none"
          >
            <div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-label="Sign in or create account"
              className="w-full max-w-[400px] bg-parchment border border-ink-rule rounded-sm shadow-search-overlay pointer-events-auto"
            >
              {/* Close button */}
              <div className="flex items-center justify-between px-5 pt-5 pb-0">
                <p className="font-serif text-[16px] font-medium text-ink-charcoal">
                  {hint ?? 'Sign in to continue'}
                </p>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-parchment-2 transition-colors text-ink-soft"
                  aria-label="Close"
                >
                  <BiX size={20} />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-ink-rule px-5 mt-4">
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
                    <p className="font-serif italic text-[14px] text-ink-soft leading-snug mb-4">
                      Your address and order history will be right where you left them.
                    </p>

                    <div>
                      {fieldLabel('Email', 'modal-si-email')}
                      <input id="modal-si-email" type="email" value={siEmail} onChange={e => { setSiEmail(e.target.value); setSiErrors(p => ({ ...p, email: undefined })) }}
                        className={siErrors.email ? errorInputClass : inputClass} placeholder="you@example.com" autoComplete="email" />
                      {siErrors.email && <p className="mt-1 text-[11px] font-sans text-error">{siErrors.email}</p>}
                    </div>

                    <div>
                      {fieldLabel('Password', 'modal-si-password')}
                      <input id="modal-si-password" type="password" value={siPassword} onChange={e => { setSiPassword(e.target.value); setSiErrors(p => ({ ...p, password: undefined })) }}
                        className={siErrors.password ? errorInputClass : inputClass} placeholder="••••••••" autoComplete="current-password" />
                      {siErrors.password && <p className="mt-1 text-[11px] font-sans text-error">{siErrors.password}</p>}
                    </div>

                    <button type="submit"
                      className="w-full min-h-[48px] bg-green-brand text-[#F5F1E6] rounded-btn font-sans text-[15px] font-semibold hover:bg-green-deep hover:shadow-cta-hover transition-all duration-200">
                      Sign in
                    </button>

                    {/* Demo hint */}
                    <div className="bg-parchment-2 border border-ink-rule rounded-sm px-4 py-3">
                      <p className="text-[10px] font-mono uppercase tracking-eyebrow text-ink-soft mb-1">Demo account</p>
                      <p className="font-mono text-[12px] text-ink-iron">{DEMO_EMAIL}</p>
                      <p className="font-mono text-[12px] text-ink-iron">{DEMO_PASSWORD}</p>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleCreate} noValidate className="space-y-4">
                    <div>
                      {fieldLabel('Full name', 'modal-ca-name')}
                      <input id="modal-ca-name" type="text" value={caName} onChange={e => { setCaName(e.target.value); setCaErrors(p => ({ ...p, name: undefined })) }}
                        className={caErrors.name ? errorInputClass : inputClass} placeholder="Margaret H." autoComplete="name" />
                      {caErrors.name && <p className="mt-1 text-[11px] font-sans text-error">{caErrors.name}</p>}
                    </div>

                    <div>
                      {fieldLabel('Email', 'modal-ca-email')}
                      <input id="modal-ca-email" type="email" value={caEmail} onChange={e => { setCaEmail(e.target.value); setCaErrors(p => ({ ...p, email: undefined })) }}
                        className={caErrors.email ? errorInputClass : inputClass} placeholder="you@example.com" autoComplete="email" />
                      {caErrors.email && <p className="mt-1 text-[11px] font-sans text-error">{caErrors.email}</p>}
                    </div>

                    <div>
                      {fieldLabel('Password', 'modal-ca-password')}
                      <input id="modal-ca-password" type="password" value={caPassword} onChange={e => { setCaPassword(e.target.value); setCaErrors(p => ({ ...p, password: undefined })) }}
                        className={caErrors.password ? errorInputClass : inputClass} placeholder="••••••••" autoComplete="new-password" />
                      {caErrors.password && <p className="mt-1 text-[11px] font-sans text-error">{caErrors.password}</p>}
                    </div>

                    <div>
                      {fieldLabel('Confirm password', 'modal-ca-confirm')}
                      <input id="modal-ca-confirm" type="password" value={caConfirm} onChange={e => { setCaConfirm(e.target.value); setCaErrors(p => ({ ...p, confirm: undefined })) }}
                        className={caErrors.confirm ? errorInputClass : inputClass} placeholder="••••••••" autoComplete="new-password" />
                      {caErrors.confirm && <p className="mt-1 text-[11px] font-sans text-error">{caErrors.confirm}</p>}
                    </div>

                    <button type="submit"
                      className="w-full min-h-[48px] bg-green-brand text-[#F5F1E6] rounded-btn font-sans text-[15px] font-semibold hover:bg-green-deep hover:shadow-cta-hover transition-all duration-200">
                      Create account
                    </button>
                  </form>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

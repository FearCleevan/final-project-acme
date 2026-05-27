'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import PageHeader from '@/components/admin/shared/PageHeader'
import SectionCard from '@/components/admin/shared/SectionCard'
import { BiCheck, BiSun, BiMoon, BiLockAlt, BiShow, BiHide } from 'react-icons/bi'
import { MOCK_ADMIN_PASSWORD } from '@/lib/admin/mockData'
import AdminSelect from '@/components/admin/shared/AdminSelect'
import { cn } from '@/lib/utils'

const inputCls  = 'w-full h-9 px-3 text-[13px] text-(--admin-text) bg-(--admin-surface-2) border border-(--admin-border) rounded-md focus:outline-none focus:border-(--admin-accent) focus:ring-1 focus:ring-(--admin-accent)/10 placeholder:text-(--admin-text-muted) transition-colors'
const labelCls  = 'block text-[12px] font-medium text-(--admin-text) mb-1.5'

function SaveButton({ saving, saved }: { saving: boolean; saved: boolean }) {
  if (saved) return (
    <div className="flex items-center gap-1.5 text-(--admin-green)">
      <BiCheck size={15} />
      <span className="text-[12px] font-medium">Saved</span>
    </div>
  )
  return (
    <button
      type="submit"
      disabled={saving}
      className="h-8 px-4 text-[12px] font-medium bg-(--admin-accent) text-(--admin-accent-text) rounded-md hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center gap-2"
    >
      {saving && <span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
      {saving ? 'Saving…' : 'Save changes'}
    </button>
  )
}

function useSection() {
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)

  function triggerSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }, 700)
  }

  return { saving, saved, triggerSave }
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center justify-between cursor-pointer py-2.5 border-b border-(--admin-border) last:border-0">
      <span className="text-[13px] text-(--admin-text)">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative w-9 h-5 rounded-full transition-colors shrink-0',
          checked ? 'bg-(--admin-accent)' : 'bg-(--admin-border)'
        )}
      >
        <span className={cn(
          'absolute top-0.5 left-0.5 w-4 h-4 rounded-full shadow-md transition-transform',
          'bg-white dark:bg-gray-200',
          checked ? 'translate-x-4' : 'translate-x-0'
        )} />
      </button>
    </label>
  )
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // Store Details
  const storeSection = useSection()
  const [store, setStore] = useState({
    name:    'Acme Lamp & Sign Co.',
    email:   'hello@acmelamp.com',
    phone:   '+1 902 555 0100',
    address: '42 Victoria Lane',
    city:    'Halifax',
    province:'Nova Scotia',
    country: 'Canada',
  })

  // Regional
  const regionalSection = useSection()
  const [regional, setRegional] = useState({
    currency: 'CAD',
    timezone: 'America/Halifax',
    dateFormat: 'DD MMM YYYY',
  })

  // Password
  const [pwFields, setPwFields] = useState({ current: '', next: '', confirm: '' })
  const [pwErrors, setPwErrors] = useState<{ current?: string; next?: string; confirm?: string }>({})
  const [pwSaving, setPwSaving] = useState(false)
  const [pwSaved,  setPwSaved]  = useState(false)
  const [showPw,   setShowPw]   = useState({ current: false, next: false, confirm: false })
  const [mockPw,   setMockPw]   = useState(MOCK_ADMIN_PASSWORD)

  function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault()
    const errs: typeof pwErrors = {}
    if (!pwFields.current)                        errs.current = 'Current password is required.'
    else if (pwFields.current !== mockPw)         errs.current = 'Incorrect current password.'
    if (!pwFields.next)                           errs.next    = 'New password is required.'
    else if (pwFields.next.length < 6)            errs.next    = 'Must be at least 6 characters.'
    if (pwFields.confirm !== pwFields.next)       errs.confirm = 'Passwords do not match.'
    if (Object.keys(errs).length) { setPwErrors(errs); return }
    setPwSaving(true)
    setTimeout(() => {
      setMockPw(pwFields.next)
      setPwFields({ current: '', next: '', confirm: '' })
      setPwErrors({})
      setPwSaving(false)
      setPwSaved(true)
      setTimeout(() => setPwSaved(false), 2000)
    }, 700)
  }

  // Notifications
  const notifSection = useSection()
  const [notifs, setNotifs] = useState({
    orderPlaced:       true,
    orderFulfilled:    true,
    lowStock:          true,
    abandonedCheckout: false,
    weeklyDigest:      true,
  })

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Manage your store preferences"
      />

      <div className="max-w-2xl space-y-6">

        {/* ── Store Details ── */}
        <SectionCard>
          <form onSubmit={storeSection.triggerSave}>
            <div className="flex items-center justify-between mb-5">
              <p className="text-[13px] font-semibold text-(--admin-text)">Store Details</p>
              <SaveButton saving={storeSection.saving} saved={storeSection.saved} />
            </div>

            <div className="space-y-4">
              <div>
                <label className={labelCls}>Store name</label>
                <input
                  value={store.name}
                  onChange={e => setStore(s => ({ ...s, name: e.target.value }))}
                  className={inputCls}
                  placeholder="My Store"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Contact email</label>
                  <input
                    type="email"
                    value={store.email}
                    onChange={e => setStore(s => ({ ...s, email: e.target.value }))}
                    className={inputCls}
                    placeholder="hello@store.com"
                  />
                </div>
                <div>
                  <label className={labelCls}>Phone</label>
                  <input
                    value={store.phone}
                    onChange={e => setStore(s => ({ ...s, phone: e.target.value }))}
                    className={inputCls}
                    placeholder="+1 000 000 0000"
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>Address</label>
                <input
                  value={store.address}
                  onChange={e => setStore(s => ({ ...s, address: e.target.value }))}
                  className={inputCls}
                  placeholder="123 Main Street"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>City</label>
                  <input
                    value={store.city}
                    onChange={e => setStore(s => ({ ...s, city: e.target.value }))}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Province / State</label>
                  <input
                    value={store.province}
                    onChange={e => setStore(s => ({ ...s, province: e.target.value }))}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Country</label>
                  <input
                    value={store.country}
                    onChange={e => setStore(s => ({ ...s, country: e.target.value }))}
                    className={inputCls}
                  />
                </div>
              </div>
            </div>
          </form>
        </SectionCard>

        {/* ── Regional ── */}
        <SectionCard>
          <form onSubmit={regionalSection.triggerSave}>
            <div className="flex items-center justify-between mb-5">
              <p className="text-[13px] font-semibold text-(--admin-text)">Regional</p>
              <SaveButton saving={regionalSection.saving} saved={regionalSection.saved} />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>Currency</label>
                <AdminSelect
                  value={regional.currency}
                  onChange={v => setRegional(r => ({ ...r, currency: v }))}
                  className="w-full"
                  options={[
                    { value: 'CAD', label: 'CAD — Canadian Dollar' },
                    { value: 'USD', label: 'USD — US Dollar' },
                    { value: 'GBP', label: 'GBP — British Pound' },
                    { value: 'EUR', label: 'EUR — Euro' },
                    { value: 'AUD', label: 'AUD — Australian Dollar' },
                  ]}
                />
              </div>
              <div>
                <label className={labelCls}>Timezone</label>
                <AdminSelect
                  value={regional.timezone}
                  onChange={v => setRegional(r => ({ ...r, timezone: v }))}
                  className="w-full"
                  options={[
                    { value: 'America/Halifax',   label: 'Atlantic (Halifax)'  },
                    { value: 'America/Toronto',   label: 'Eastern (Toronto)'   },
                    { value: 'America/Winnipeg',  label: 'Central (Winnipeg)'  },
                    { value: 'America/Edmonton',  label: 'Mountain (Edmonton)' },
                    { value: 'America/Vancouver', label: 'Pacific (Vancouver)' },
                    { value: 'Europe/London',     label: 'London'              },
                    { value: 'Europe/Paris',      label: 'Paris'               },
                  ]}
                />
              </div>
              <div>
                <label className={labelCls}>Date format</label>
                <AdminSelect
                  value={regional.dateFormat}
                  onChange={v => setRegional(r => ({ ...r, dateFormat: v }))}
                  className="w-full"
                  options={[
                    { value: 'DD MMM YYYY',  label: '28 May 2026'   },
                    { value: 'MMM DD, YYYY', label: 'May 28, 2026'  },
                    { value: 'YYYY-MM-DD',   label: '2026-05-28'    },
                    { value: 'DD/MM/YYYY',   label: '28/05/2026'    },
                    { value: 'MM/DD/YYYY',   label: '05/28/2026'    },
                  ]}
                />
              </div>
            </div>
          </form>
        </SectionCard>

        {/* ── Notifications ── */}
        <SectionCard>
          <form onSubmit={notifSection.triggerSave}>
            <div className="flex items-center justify-between mb-5">
              <p className="text-[13px] font-semibold text-(--admin-text)">Email Notifications</p>
              <SaveButton saving={notifSection.saving} saved={notifSection.saved} />
            </div>

            <div>
              <Toggle
                label="New order placed"
                checked={notifs.orderPlaced}
                onChange={v => setNotifs(n => ({ ...n, orderPlaced: v }))}
              />
              <Toggle
                label="Order fulfilled"
                checked={notifs.orderFulfilled}
                onChange={v => setNotifs(n => ({ ...n, orderFulfilled: v }))}
              />
              <Toggle
                label="Low stock alert"
                checked={notifs.lowStock}
                onChange={v => setNotifs(n => ({ ...n, lowStock: v }))}
              />
              <Toggle
                label="Abandoned checkout"
                checked={notifs.abandonedCheckout}
                onChange={v => setNotifs(n => ({ ...n, abandonedCheckout: v }))}
              />
              <Toggle
                label="Weekly performance digest"
                checked={notifs.weeklyDigest}
                onChange={v => setNotifs(n => ({ ...n, weeklyDigest: v }))}
              />
            </div>
          </form>
        </SectionCard>

        {/* ── Password ── */}
        <SectionCard>
          <form onSubmit={handlePasswordSave}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <BiLockAlt size={15} className="text-(--admin-text-muted)" />
                <p className="text-[13px] font-semibold text-(--admin-text)">Change Password</p>
              </div>
              {pwSaved ? (
                <div className="flex items-center gap-1.5 text-(--admin-green)">
                  <BiCheck size={15} />
                  <span className="text-[12px] font-medium">Updated</span>
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={pwSaving}
                  className="h-8 px-4 text-[12px] font-medium bg-(--admin-accent) text-(--admin-accent-text) rounded-md hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center gap-2"
                >
                  {pwSaving && <span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
                  {pwSaving ? 'Saving…' : 'Update password'}
                </button>
              )}
            </div>

            <div className="space-y-4">
              {([
                { key: 'current', label: 'Current password', placeholder: 'Enter current password' },
                { key: 'next',    label: 'New password',     placeholder: 'At least 6 characters'  },
                { key: 'confirm', label: 'Confirm new password', placeholder: 'Repeat new password' },
              ] as const).map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className={labelCls}>{label}</label>
                  <div className="relative">
                    <input
                      type={showPw[key] ? 'text' : 'password'}
                      value={pwFields[key]}
                      onChange={e => { setPwFields(f => ({ ...f, [key]: e.target.value })); setPwErrors(err => ({ ...err, [key]: undefined })) }}
                      placeholder={placeholder}
                      className={cn(inputCls, 'pr-9', pwErrors[key] && 'border-(--admin-red) focus:border-(--admin-red)')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(s => ({ ...s, [key]: !s[key] }))}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-(--admin-text-muted) hover:text-(--admin-text) transition-colors"
                    >
                      {showPw[key] ? <BiHide size={15} /> : <BiShow size={15} />}
                    </button>
                  </div>
                  {pwErrors[key] && <p className="text-[11px] text-(--admin-red) mt-1">{pwErrors[key]}</p>}
                </div>
              ))}
            </div>
          </form>
        </SectionCard>

        {/* ── Appearance ── */}
        <SectionCard>
          <p className="text-[13px] font-semibold text-(--admin-text) mb-5">Appearance</p>
          <div className="flex items-center gap-3">
            {[
              { value: 'light', label: 'Light', icon: BiSun  },
              { value: 'dark',  label: 'Dark',  icon: BiMoon },
            ].map(opt => {
              const Icon    = opt.icon
              const active  = mounted && theme === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTheme(opt.value)}
                  className={cn(
                    'flex items-center gap-2 h-9 px-4 rounded-md border text-[13px] transition-colors',
                    active
                      ? 'bg-(--admin-accent) text-(--admin-accent-text) border-transparent'
                      : 'text-(--admin-text-soft) bg-(--admin-surface-2) border-(--admin-border) hover:bg-(--admin-border)'
                  )}
                >
                  <Icon size={15} />
                  {opt.label}
                </button>
              )
            })}
          </div>
          <p className="text-[11px] text-(--admin-text-muted) mt-3">
            Theme is also togglable from the sidebar footer.
          </p>
        </SectionCard>

      </div>
    </div>
  )
}

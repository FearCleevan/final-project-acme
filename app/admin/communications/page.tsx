'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import PageHeader from '@/components/admin/shared/PageHeader'
import SectionCard from '@/components/admin/shared/SectionCard'
import Badge from '@/components/admin/shared/Badge'
import Toast, { ToastType } from '@/components/admin/shared/Toast'
import { cn } from '@/lib/utils'
import {
  BiEnvelope, BiNote, BiLoader, BiCheck, BiTrash, BiPin,
  BiEditAlt, BiX, BiChevronDown, BiChevronUp, BiMailSend,
  BiRefresh, BiPlus,
} from 'react-icons/bi'

// ── Types ────────────────────────────────────────────────────────────────────

interface WaitlistGroup {
  productHandle: string
  productTitle:  string
  total:         number
  pending:       number
  subscribers:   { id: string; email: string; createdAt: string; notifiedAt: string | null }[]
}

interface ContactMessage {
  id:         string
  name:       string
  email:      string
  subject:    string
  message:    string
  read_at:    string | null
  replied_at: string | null
  created_at: string
}

interface BenchNote {
  id:         string
  title:      string
  body:       string
  pinned:     boolean
  created_at: string
  updated_at: string
}

type Tab = 'waitlist' | 'inbox' | 'notes'

// ── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)   return 'just now'
  if (m < 60)  return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24)  return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function CommunicationsPage() {
  const [tab, setTab] = useState<Tab>('waitlist')

  // Waitlist state
  const [waitlist,      setWaitlist]      = useState<WaitlistGroup[]>([])
  const [waitlistLoad,  setWaitlistLoad]  = useState(true)
  const [expanded,      setExpanded]      = useState<Set<string>>(new Set())
  const [notifying,     setNotifying]     = useState<string | null>(null)

  // Inbox state
  const [contacts,      setContacts]      = useState<ContactMessage[]>([])
  const [contactLoad,   setContactLoad]   = useState(true)
  const [openMsg,       setOpenMsg]       = useState<string | null>(null)
  const [inboxFilter,   setInboxFilter]   = useState<'all' | 'unread' | 'replied'>('all')

  // Notes state
  const [notes,         setNotes]         = useState<BenchNote[]>([])
  const [notesLoad,     setNotesLoad]     = useState(true)
  const [noteForm,      setNoteForm]      = useState<{ title: string; body: string } | null>(null)
  const [editingNote,   setEditingNote]   = useState<BenchNote | null>(null)
  const [savingNote,    setSavingNote]    = useState(false)

  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)
  const noteBodyRef = useRef<HTMLTextAreaElement>(null)

  const showToast = useCallback((message: string, type: ToastType) => {
    setToast({ message, type })
  }, [])

  // ── Loaders ──

  useEffect(() => {
    fetch('/api/admin/communications/waitlist')
      .then(r => r.ok ? r.json() : [])
      .then(setWaitlist)
      .finally(() => setWaitlistLoad(false))
  }, [])

  useEffect(() => {
    if (tab !== 'inbox') return
    setContactLoad(true)
    fetch('/api/admin/communications/contacts')
      .then(r => r.ok ? r.json() : [])
      .then(setContacts)
      .finally(() => setContactLoad(false))
  }, [tab])

  useEffect(() => {
    if (tab !== 'notes') return
    setNotesLoad(true)
    fetch('/api/admin/communications/bench-notes')
      .then(r => r.ok ? r.json() : [])
      .then(setNotes)
      .finally(() => setNotesLoad(false))
  }, [tab])

  // ── Waitlist actions ──

  async function notifyProduct(handle: string) {
    setNotifying(handle)
    try {
      const res  = await fetch('/api/admin/products/notify-restock', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ productHandle: handle }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      showToast(`Notified ${data.sent} customer(s).`, 'success')
      // Refresh waitlist
      const fresh = await fetch('/api/admin/communications/waitlist').then(r => r.json())
      setWaitlist(fresh)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to notify', 'error')
    } finally {
      setNotifying(null)
    }
  }

  function toggleExpanded(handle: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(handle) ? next.delete(handle) : next.add(handle)
      return next
    })
  }

  // ── Inbox actions ──

  async function patchContact(id: string, patch: Record<string, boolean>) {
    const res = await fetch(`/api/admin/communications/contacts/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(patch),
    })
    if (!res.ok) { showToast('Update failed', 'error'); return }
    setContacts(cs => cs.map(c => {
      if (c.id !== id) return c
      const now = new Date().toISOString()
      return {
        ...c,
        read_at:    patch.markRead    ? now : patch.unread ? null : c.read_at,
        replied_at: patch.markReplied ? now : c.replied_at,
      }
    }))
  }

  async function deleteContact(id: string) {
    const res = await fetch(`/api/admin/communications/contacts/${id}`, { method: 'DELETE' })
    if (!res.ok) { showToast('Delete failed', 'error'); return }
    setContacts(cs => cs.filter(c => c.id !== id))
    if (openMsg === id) setOpenMsg(null)
    showToast('Message deleted.', 'success')
  }

  // ── Notes actions ──

  async function saveNote() {
    if (!noteForm?.body.trim()) return
    setSavingNote(true)
    try {
      const res = await fetch('/api/admin/communications/bench-notes', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(noteForm),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setNotes(ns => [data, ...ns])
      setNoteForm(null)
      showToast('Note saved.', 'success')
    } catch {
      showToast('Failed to save note.', 'error')
    } finally {
      setSavingNote(false)
    }
  }

  async function updateNote(id: string, patch: Partial<BenchNote>) {
    const res = await fetch(`/api/admin/communications/bench-notes/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(patch),
    })
    if (!res.ok) { showToast('Update failed', 'error'); return }
    setNotes(ns => ns.map(n =>
      n.id === id ? { ...n, ...patch, updated_at: new Date().toISOString() } : n
    ).sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)))
    if (editingNote?.id === id) setEditingNote(null)
  }

  async function deleteNote(id: string) {
    const res = await fetch(`/api/admin/communications/bench-notes/${id}`, { method: 'DELETE' })
    if (!res.ok) { showToast('Delete failed', 'error'); return }
    setNotes(ns => ns.filter(n => n.id !== id))
    if (editingNote?.id === id) setEditingNote(null)
    showToast('Note deleted.', 'success')
  }

  // ── Derived counts ──
  const unreadCount  = contacts.filter(c => !c.read_at).length
  const pendingTotal = waitlist.reduce((s, g) => s + g.pending, 0)

  const filteredContacts = contacts.filter(c => {
    if (inboxFilter === 'unread')  return !c.read_at
    if (inboxFilter === 'replied') return !!c.replied_at
    return true
  })

  // ── Render ──

  const TABS: { id: Tab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'waitlist', label: 'Restock Waitlist', icon: BiMailSend, badge: pendingTotal || undefined },
    { id: 'inbox',    label: 'Contact Inbox',    icon: BiEnvelope, badge: unreadCount  || undefined },
    { id: 'notes',    label: 'Bench Notes',      icon: BiNote                                       },
  ]

  return (
    <div>
      <PageHeader
        title="Communications"
        subtitle="Restock waitlists, customer messages, and workshop notes"
      />

      <SectionCard noPadding>
        {/* Tab bar */}
        <div className="flex items-center gap-1 px-5 py-3 border-b border-(--admin-border) overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-md text-[13px] font-medium whitespace-nowrap transition-colors',
                tab === id
                  ? 'bg-(--admin-accent) text-(--admin-accent-text)'
                  : 'text-(--admin-text-soft) hover:bg-(--admin-surface-2) hover:text-(--admin-text)'
              )}
            >
              <Icon size={15} />
              {label}
              {badge != null && (
                <span className={cn(
                  'text-[10px] px-1.5 py-0.5 rounded-full',
                  tab === id
                    ? 'bg-white/20 text-(--admin-accent-text)'
                    : 'bg-(--admin-red-bg) text-(--admin-red)'
                )}>
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── WAITLIST TAB ── */}
        {tab === 'waitlist' && (
          <div className="divide-y divide-(--admin-border)">
            {waitlistLoad ? (
              <div className="flex items-center justify-center py-16">
                <BiLoader size={20} className="animate-spin text-(--admin-text-muted)" />
              </div>
            ) : waitlist.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-[13px] text-(--admin-text-soft)">No restock requests yet.</p>
                <p className="text-[11px] text-(--admin-text-muted) mt-1">Customers who click &ldquo;Notify me&rdquo; on out-of-stock products appear here.</p>
              </div>
            ) : waitlist.map(group => (
              <div key={group.productHandle} className="px-5 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[14px] font-medium text-(--admin-text) truncate">{group.productTitle}</p>
                    <p className="text-[11px] text-(--admin-text-muted) mt-0.5">
                      {group.pending > 0
                        ? <span className="text-(--admin-red) font-medium">{group.pending} pending</span>
                        : <span>0 pending</span>
                      }
                      {' · '}{group.total} total
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => toggleExpanded(group.productHandle)}
                      className="flex items-center gap-1 h-8 px-3 text-[12px] text-(--admin-text-muted) bg-(--admin-surface-2) border border-(--admin-border) rounded hover:bg-(--admin-border) transition-colors"
                    >
                      {expanded.has(group.productHandle) ? <BiChevronUp size={14} /> : <BiChevronDown size={14} />}
                      {group.subscribers.length}
                    </button>
                    <button
                      disabled={group.pending === 0 || notifying === group.productHandle}
                      onClick={() => notifyProduct(group.productHandle)}
                      className={cn(
                        'flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium rounded transition-colors',
                        group.pending > 0
                          ? 'bg-(--admin-accent) text-(--admin-accent-text) hover:opacity-90'
                          : 'bg-(--admin-surface-2) text-(--admin-text-muted) border border-(--admin-border) cursor-not-allowed'
                      )}
                    >
                      {notifying === group.productHandle
                        ? <BiLoader size={13} className="animate-spin" />
                        : <BiMailSend size={13} />
                      }
                      {notifying === group.productHandle ? 'Sending…' : `Notify ${group.pending}`}
                    </button>
                  </div>
                </div>

                {/* Subscriber list */}
                {expanded.has(group.productHandle) && (
                  <div className="mt-3 rounded-md border border-(--admin-border) divide-y divide-(--admin-border) overflow-hidden">
                    {group.subscribers.map(s => (
                      <div key={s.id} className="flex items-center justify-between px-4 py-2.5 bg-(--admin-surface-2)">
                        <span className="text-[12px] text-(--admin-text)">{s.email}</span>
                        <div className="flex items-center gap-3 text-[11px] text-(--admin-text-muted)">
                          <span>{timeAgo(s.createdAt)}</span>
                          {s.notifiedAt
                            ? <Badge label="Notified" variant="green" />
                            : <Badge label="Pending"  variant="amber" />
                          }
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── INBOX TAB ── */}
        {tab === 'inbox' && (
          <div>
            {/* Filter tabs */}
            <div className="flex items-center gap-1 px-5 py-3 border-b border-(--admin-border)">
              {(['all', 'unread', 'replied'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setInboxFilter(f)}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-[12px] capitalize transition-colors',
                    inboxFilter === f
                      ? 'bg-(--admin-surface-2) text-(--admin-text) font-medium'
                      : 'text-(--admin-text-muted) hover:text-(--admin-text)'
                  )}
                >
                  {f}
                  {f === 'unread' && unreadCount > 0 && (
                    <span className="ml-1.5 text-[10px] bg-(--admin-red-bg) text-(--admin-red) px-1.5 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="divide-y divide-(--admin-border)">
              {contactLoad ? (
                <div className="flex items-center justify-center py-16">
                  <BiLoader size={20} className="animate-spin text-(--admin-text-muted)" />
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="text-[13px] text-(--admin-text-soft)">No messages here.</p>
                </div>
              ) : filteredContacts.map(msg => (
                <div
                  key={msg.id}
                  className={cn(
                    'px-5 py-4 transition-colors',
                    !msg.read_at && 'bg-(--admin-surface-2)',
                    openMsg === msg.id && 'bg-(--admin-surface-2)'
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => {
                        setOpenMsg(openMsg === msg.id ? null : msg.id)
                        if (!msg.read_at) patchContact(msg.id, { markRead: true })
                      }}
                    >
                      <div className="flex items-center gap-2 mb-0.5">
                        {!msg.read_at && (
                          <span className="w-2 h-2 rounded-full bg-(--admin-accent) shrink-0" />
                        )}
                        <span className="text-[14px] font-medium text-(--admin-text) truncate">{msg.name}</span>
                        <span className="text-[11px] text-(--admin-text-muted) shrink-0">{timeAgo(msg.created_at)}</span>
                      </div>
                      <p className="text-[12px] text-(--admin-text-soft) truncate">{msg.subject}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {msg.read_at && !msg.replied_at && (
                        <button
                          onClick={() => patchContact(msg.id, { markReplied: true })}
                          title="Mark replied"
                          className="w-7 h-7 flex items-center justify-center rounded text-(--admin-text-muted) hover:text-(--admin-accent) hover:bg-(--admin-surface-2) transition-colors"
                        >
                          <BiCheck size={15} />
                        </button>
                      )}
                      {msg.replied_at && (
                        <Badge label="Replied" variant="green" />
                      )}
                      <button
                        onClick={() => deleteContact(msg.id)}
                        title="Delete"
                        className="w-7 h-7 flex items-center justify-center rounded text-(--admin-text-muted) hover:text-(--admin-red) hover:bg-(--admin-red-bg) transition-colors"
                      >
                        <BiTrash size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Expanded message */}
                  {openMsg === msg.id && (
                    <div className="mt-4 space-y-3">
                      <div className="flex flex-wrap gap-x-6 gap-y-1 text-[11px] text-(--admin-text-muted)">
                        <span>From: <span className="text-(--admin-text)">{msg.email}</span></span>
                        <span>Subject: <span className="text-(--admin-text)">{msg.subject}</span></span>
                      </div>
                      <div className="bg-(--admin-bg) rounded-md p-4 border border-(--admin-border)">
                        <p className="text-[13px] text-(--admin-text) leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject)}`}
                          onClick={() => patchContact(msg.id, { markReplied: true })}
                          className="flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium bg-(--admin-accent) text-(--admin-accent-text) rounded hover:opacity-90 transition-opacity"
                        >
                          <BiEnvelope size={13} /> Reply via email
                        </a>
                        {!msg.read_at ? (
                          <button
                            onClick={() => patchContact(msg.id, { markRead: true })}
                            className="flex items-center gap-1.5 h-8 px-3 text-[12px] text-(--admin-text-muted) bg-(--admin-surface-2) border border-(--admin-border) rounded hover:bg-(--admin-border) transition-colors"
                          >
                            <BiCheck size={13} /> Mark read
                          </button>
                        ) : (
                          <button
                            onClick={() => patchContact(msg.id, { unread: true })}
                            className="flex items-center gap-1.5 h-8 px-3 text-[12px] text-(--admin-text-muted) bg-(--admin-surface-2) border border-(--admin-border) rounded hover:bg-(--admin-border) transition-colors"
                          >
                            <BiRefresh size={13} /> Mark unread
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── NOTES TAB ── */}
        {tab === 'notes' && (
          <div className="p-5">
            {/* Add note button / form */}
            {!noteForm && !editingNote && (
              <button
                onClick={() => {
                  setNoteForm({ title: '', body: '' })
                  setTimeout(() => noteBodyRef.current?.focus(), 0)
                }}
                className="flex items-center gap-2 h-9 px-4 mb-5 text-[13px] font-medium bg-(--admin-accent) text-(--admin-accent-text) rounded-md hover:opacity-90 transition-opacity"
              >
                <BiPlus size={16} /> Add note
              </button>
            )}

            {/* New note form */}
            {noteForm && (
              <div className="mb-5 rounded-lg border-2 border-(--admin-accent) bg-(--admin-surface-2) p-4 space-y-3">
                <input
                  type="text"
                  value={noteForm.title}
                  onChange={e => setNoteForm(f => f && ({ ...f, title: e.target.value }))}
                  placeholder="Title (optional)"
                  className="w-full bg-transparent text-[14px] font-semibold text-(--admin-text) placeholder:text-(--admin-text-muted) focus:outline-none"
                />
                <textarea
                  ref={noteBodyRef}
                  value={noteForm.body}
                  onChange={e => setNoteForm(f => f && ({ ...f, body: e.target.value }))}
                  placeholder="Write your bench note…"
                  rows={4}
                  className="w-full bg-transparent text-[13px] text-(--admin-text) placeholder:text-(--admin-text-muted) focus:outline-none resize-none"
                />
                <div className="flex items-center gap-2 pt-1 border-t border-(--admin-border)">
                  <button
                    onClick={saveNote}
                    disabled={savingNote || !noteForm.body.trim()}
                    className="flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium bg-(--admin-accent) text-(--admin-accent-text) rounded hover:opacity-90 disabled:opacity-50 transition-opacity"
                  >
                    {savingNote ? <BiLoader size={13} className="animate-spin" /> : <BiCheck size={13} />}
                    Save
                  </button>
                  <button
                    onClick={() => setNoteForm(null)}
                    className="flex items-center gap-1 h-8 px-3 text-[12px] text-(--admin-text-muted) bg-(--admin-surface-2) border border-(--admin-border) rounded hover:bg-(--admin-border) transition-colors"
                  >
                    <BiX size={13} /> Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Notes grid */}
            {notesLoad ? (
              <div className="flex items-center justify-center py-12">
                <BiLoader size={20} className="animate-spin text-(--admin-text-muted)" />
              </div>
            ) : notes.length === 0 && !noteForm ? (
              <div className="py-16 text-center">
                <p className="text-[13px] text-(--admin-text-soft)">No bench notes yet.</p>
                <p className="text-[11px] text-(--admin-text-muted) mt-1">Use notes to track workshop reminders, product quirks, or customer lore.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {notes.map(note => (
                  <div
                    key={note.id}
                    className={cn(
                      'rounded-lg border bg-(--admin-surface-2) p-4 flex flex-col gap-2 transition-colors',
                      note.pinned ? 'border-(--admin-accent)/40' : 'border-(--admin-border)'
                    )}
                  >
                    {/* Edit mode */}
                    {editingNote?.id === note.id ? (
                      <>
                        <input
                          type="text"
                          value={editingNote.title}
                          onChange={e => setEditingNote(n => n && ({ ...n, title: e.target.value }))}
                          placeholder="Title"
                          className="bg-transparent text-[13px] font-semibold text-(--admin-text) focus:outline-none w-full"
                        />
                        <textarea
                          value={editingNote.body}
                          onChange={e => setEditingNote(n => n && ({ ...n, body: e.target.value }))}
                          rows={4}
                          className="bg-transparent text-[12px] text-(--admin-text) focus:outline-none resize-none w-full"
                        />
                        <div className="flex items-center gap-2 pt-2 border-t border-(--admin-border)">
                          <button
                            onClick={() => updateNote(note.id, { title: editingNote.title, body: editingNote.body })}
                            className="flex items-center gap-1 h-7 px-2.5 text-[11px] bg-(--admin-accent) text-(--admin-accent-text) rounded hover:opacity-90"
                          >
                            <BiCheck size={12} /> Save
                          </button>
                          <button
                            onClick={() => setEditingNote(null)}
                            className="flex items-center gap-1 h-7 px-2.5 text-[11px] text-(--admin-text-muted) bg-(--admin-surface-2) border border-(--admin-border) rounded hover:bg-(--admin-border)"
                          >
                            <BiX size={12} /> Cancel
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        {note.title && (
                          <p className="text-[13px] font-semibold text-(--admin-text) leading-snug">{note.title}</p>
                        )}
                        <p className="text-[12px] text-(--admin-text-soft) leading-relaxed line-clamp-6 flex-1 whitespace-pre-wrap">{note.body}</p>
                        <div className="flex items-center justify-between pt-2 border-t border-(--admin-border)">
                          <span className="text-[10px] text-(--admin-text-muted)">{timeAgo(note.updated_at)}</span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => updateNote(note.id, { pinned: !note.pinned })}
                              title={note.pinned ? 'Unpin' : 'Pin'}
                              className={cn(
                                'w-6 h-6 flex items-center justify-center rounded transition-colors',
                                note.pinned
                                  ? 'text-(--admin-accent) hover:opacity-70'
                                  : 'text-(--admin-text-muted) hover:text-(--admin-accent) hover:bg-(--admin-surface-2)'
                              )}
                            >
                              <BiPin size={13} />
                            </button>
                            <button
                              onClick={() => setEditingNote({ ...note })}
                              className="w-6 h-6 flex items-center justify-center rounded text-(--admin-text-muted) hover:text-(--admin-accent) hover:bg-(--admin-surface-2) transition-colors"
                            >
                              <BiEditAlt size={13} />
                            </button>
                            <button
                              onClick={() => deleteNote(note.id)}
                              className="w-6 h-6 flex items-center justify-center rounded text-(--admin-text-muted) hover:text-(--admin-red) hover:bg-(--admin-red-bg) transition-colors"
                            >
                              <BiTrash size={13} />
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="px-5 py-3 border-t border-(--admin-border)">
          <p className="text-[11px] text-(--admin-text-muted)">
            Restock waitlists sync from Shopify. Contact messages and bench notes are stored in Supabase.
          </p>
        </div>
      </SectionCard>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  )
}

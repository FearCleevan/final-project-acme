'use client'

import { useState, useEffect } from 'react'
import Toast, { ToastType } from '@/components/admin/shared/Toast'
import { AdminCollection } from '@/lib/admin/types'
import { slugify } from '@/lib/admin/utils'
import PageHeader from '@/components/admin/shared/PageHeader'
import SectionCard from '@/components/admin/shared/SectionCard'
import ConfirmModal from '@/components/admin/shared/ConfirmModal'
import { cn } from '@/lib/utils'
import { BiPlus, BiPencil, BiTrash, BiCollection, BiX, BiCheck } from 'react-icons/bi'

const inputCls = 'w-full h-9 px-3 text-[13px] text-(--admin-text) bg-(--admin-surface-2) border border-(--admin-border) rounded-md focus:outline-none focus:border-(--admin-accent) focus:ring-1 focus:ring-(--admin-accent)/10 placeholder:text-(--admin-text-muted) transition-colors'
const labelCls = 'block text-[12px] font-medium text-(--admin-text) mb-1.5'
const errorCls = 'text-[11px] text-(--admin-red) mt-1'

interface DraftState {
  title: string
  handle: string
  description: string
  handleLocked: boolean
}

const EMPTY_DRAFT: DraftState = { title: '', handle: '', description: '', handleLocked: false }

export default function CollectionsPage() {
  const [collections, setCollections] = useState<AdminCollection[]>([])
  const [loading,     setLoading]     = useState(true)
  const [toast,       setToast]       = useState<{ message: string; type: ToastType } | null>(null)

  // Modal visibility
  const [modalOpen, setModalOpen]         = useState(false)
  const [editingId, setEditingId]         = useState<string | null>(null)

  // Draft state — persists when modal is closed via X (not Discard)
  const [draft, setDraft]                 = useState<DraftState>(EMPTY_DRAFT)

  // UI states
  const [saving,   setSaving]             = useState(false)
  const [success,  setSuccess]            = useState(false)
  const [errors,   setErrors]             = useState<{ title?: string }>({})

  // Delete modal
  const [deleteTarget, setDeleteTarget]   = useState<AdminCollection | null>(null)

  useEffect(() => {
    fetch('/api/admin/collections')
      .then(r => r.ok ? r.json() : [])
      .then(setCollections)
      .finally(() => setLoading(false))
  }, [])

  // Auto-slug title → handle unless manually locked
  useEffect(() => {
    if (!draft.handleLocked) {
      setDraft(d => ({ ...d, handle: slugify(d.title) }))
    }
  }, [draft.title, draft.handleLocked])

  function openCreate() {
    setEditingId(null)
    setDraft(EMPTY_DRAFT)           // fresh draft for new collection
    setErrors({})
    setSuccess(false)
    setModalOpen(true)
  }

  function openEdit(col: AdminCollection) {
    setEditingId(col.id)
    setDraft({ title: col.title, handle: col.handle, description: col.description, handleLocked: true })
    setErrors({})
    setSuccess(false)
    setModalOpen(true)
  }

  function closeModal() {
    // X button — preserve draft (don't reset) so user doesn't lose typing
    setModalOpen(false)
    setSaving(false)
    setSuccess(false)
  }

  function discardModal() {
    // Explicit discard — clear draft
    setModalOpen(false)
    setDraft(EMPTY_DRAFT)
    setEditingId(null)
    setErrors({})
    setSaving(false)
    setSuccess(false)
  }

  function validate(): boolean {
    const errs: { title?: string } = {}
    if (!draft.title.trim()) errs.title = 'Title is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSave() {
    if (!validate()) return
    const currentEditingId = editingId
    setSaving(true)
    try {
      const body = {
        title:       draft.title.trim(),
        handle:      draft.handle.trim() || slugify(draft.title),
        description: draft.description.trim(),
      }
      const res = currentEditingId
        ? await fetch(`/api/admin/collections/${currentEditingId}`, {
            method:  'PUT',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(body),
          })
        : await fetch('/api/admin/collections', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(body),
          })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to save collection')
      }
      const saved: AdminCollection = await res.json()
      setCollections(cs =>
        currentEditingId
          ? cs.map(c => c.id === currentEditingId ? saved : c)
          : [...cs, saved]
      )
      setSuccess(true)
      setToast({ message: currentEditingId ? 'Collection updated.' : 'Collection created.', type: 'success' })
      setTimeout(() => {
        setSuccess(false)
        setModalOpen(false)
        setDraft(EMPTY_DRAFT)
        if (editingId === currentEditingId) setEditingId(null)
      }, 1200)
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Failed to save collection', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(col: AdminCollection) {
    try {
      const res = await fetch(`/api/admin/collections/${col.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to delete collection')
      }
      setCollections(cs => cs.filter(c => c.id !== col.id))
      setDeleteTarget(null)
      setToast({ message: 'Collection deleted.', type: 'success' })
    } catch (err) {
      setDeleteTarget(null)
      setToast({ message: err instanceof Error ? err.message : 'Failed to delete collection', type: 'error' })
    }
  }

  const isEditing = editingId !== null

  return (
    <div>
      <PageHeader
        title="Collections"
        subtitle={`${collections.length} collections`}
        actions={
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium bg-(--admin-accent) text-(--admin-accent-text) rounded-md hover:opacity-90 transition-opacity"
          >
            <BiPlus size={15} /> Add collection
          </button>
        }
      />

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <SectionCard key={i}>
              <div className="space-y-3 animate-pulse">
                <div className="h-4 w-32 bg-(--admin-border) rounded" />
                <div className="h-3 w-48 bg-(--admin-border) rounded" />
                <div className="h-3 w-24 bg-(--admin-border) rounded" />
              </div>
            </SectionCard>
          ))}
        </div>
      ) : collections.length === 0 ? (
        <SectionCard>
          <div className="py-16 text-center">
            <BiCollection size={32} className="mx-auto text-(--admin-border) mb-3" />
            <p className="text-[14px] text-(--admin-text-soft)">No collections yet</p>
            <p className="text-[12px] text-(--admin-text-muted) mt-1">Create your first collection to organise products.</p>
            <button
              onClick={openCreate}
              className="mt-4 flex items-center gap-1.5 mx-auto h-8 px-4 text-[12px] font-medium bg-(--admin-accent) text-(--admin-accent-text) rounded-md hover:opacity-90 transition-opacity"
            >
              <BiPlus size={14} /> Add collection
            </button>
          </div>
        </SectionCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map(col => (
            <SectionCard key={col.id} className="flex flex-col gap-3 group relative">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="shrink-0 w-8 h-8 rounded-md bg-(--admin-surface-2) border border-(--admin-border) flex items-center justify-center">
                    <BiCollection size={15} className="text-(--admin-text-muted)" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-(--admin-text) truncate leading-snug">{col.title}</p>
                    <p className="text-[11px] text-(--admin-text-muted) truncate leading-snug">/collections/{col.handle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(col)}
                    className="w-7 h-7 flex items-center justify-center rounded-md text-(--admin-text-muted) hover:bg-(--admin-surface-2) hover:text-(--admin-text) transition-colors"
                  >
                    <BiPencil size={13} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(col)}
                    className="w-7 h-7 flex items-center justify-center rounded-md text-(--admin-text-muted) hover:bg-(--admin-red-bg) hover:text-(--admin-red) transition-colors"
                  >
                    <BiTrash size={13} />
                  </button>
                </div>
              </div>

              <p className="text-[12px] text-(--admin-text-soft) leading-relaxed line-clamp-2 flex-1">
                {col.description || <span className="text-(--admin-text-muted) italic">No description</span>}
              </p>

              <div className="pt-2 border-t border-(--admin-border) flex items-center justify-between">
                <span className="text-[11px] text-(--admin-text-muted)">
                  {col.productCount} product{col.productCount !== 1 ? 's' : ''}
                </span>
                <button
                  onClick={() => openEdit(col)}
                  className="text-[11px] text-(--admin-text-muted) hover:text-(--admin-text) transition-colors"
                >
                  Edit →
                </button>
              </div>
            </SectionCard>
          ))}
        </div>
      )}

      {/* ── Add / Edit Collection Modal ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />

          {/* Dialog */}
          <div className="relative w-full max-w-lg bg-(--admin-surface) border border-(--admin-border) rounded-xl shadow-2xl flex flex-col max-h-[90vh]">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-(--admin-border) shrink-0">
              <p className="text-[15px] font-semibold text-(--admin-text)">
                {isEditing ? 'Edit collection' : 'New collection'}
              </p>
              <button
                onClick={closeModal}
                className="w-8 h-8 flex items-center justify-center rounded-md text-(--admin-text-muted) hover:bg-(--admin-surface-2) hover:text-(--admin-text) transition-colors"
              >
                <BiX size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

              {/* Title */}
              <div>
                <label className={labelCls}>
                  Title <span className="text-(--admin-red)">*</span>
                </label>
                <input
                  autoFocus
                  value={draft.title}
                  onChange={e => { setDraft(d => ({ ...d, title: e.target.value })); setErrors({}) }}
                  onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
                  className={cn(inputCls, errors.title && 'border-(--admin-red) focus:border-(--admin-red)')}
                  placeholder="Oil Lamp Shades"
                  disabled={saving || success}
                />
                {errors.title && <p className={errorCls}>{errors.title}</p>}
              </div>

              {/* Handle */}
              <div>
                <label className={labelCls}>URL handle</label>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-(--admin-text-muted) shrink-0 whitespace-nowrap">/collections/</span>
                  <input
                    value={draft.handle}
                    onChange={e => setDraft(d => ({ ...d, handle: e.target.value, handleLocked: true }))}
                    className={inputCls}
                    placeholder="oil-lamp-shades"
                    disabled={saving || success}
                  />
                </div>
                <p className="text-[11px] text-(--admin-text-muted) mt-1.5">Auto-generated from title. Edit to customise.</p>
              </div>

              {/* Description */}
              <div>
                <label className={labelCls}>Description</label>
                <textarea
                  value={draft.description}
                  onChange={e => setDraft(d => ({ ...d, description: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 text-[13px] text-(--admin-text) bg-(--admin-surface-2) border border-(--admin-border) rounded-md resize-none focus:outline-none focus:border-(--admin-accent) focus:ring-1 focus:ring-(--admin-accent)/10 placeholder:text-(--admin-text-muted) transition-colors"
                  placeholder="Victorian and Edwardian oil lamp shades…"
                  disabled={saving || success}
                />
              </div>


            </div>

            {/* Footer */}
            <div className="shrink-0 px-6 py-4 border-t border-(--admin-border) flex items-center justify-end gap-3">
              {success ? (
                <div className="flex items-center gap-2 text-(--admin-green)">
                  <BiCheck size={16} />
                  <span className="text-[13px] font-medium">
                    {isEditing ? 'Changes saved' : 'Collection created'}
                  </span>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={discardModal}
                    disabled={saving}
                    className="h-9 px-4 text-[12px] text-(--admin-text-soft) bg-(--admin-surface-2) border border-(--admin-border) rounded-md hover:bg-(--admin-border) transition-colors disabled:opacity-50"
                  >
                    Discard
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="h-9 px-5 text-[12px] font-medium bg-(--admin-accent) text-(--admin-accent-text) rounded-md hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        Saving…
                      </>
                    ) : isEditing ? 'Save changes' : 'Create collection'}
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <ConfirmModal
          isOpen
          title="Delete collection?"
          message={`"${deleteTarget.title}" will be removed. This cannot be undone. In Plan 1 this only affects your current session.`}
          confirmLabel="Delete"
          dangerous
          onConfirm={() => handleDelete(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}

'use client'

import { useEffect, useRef } from 'react'
import { BiX, BiErrorAlt } from 'react-icons/bi'

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  dangerous?: boolean
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel  = 'Cancel',
  onConfirm,
  onCancel,
  dangerous = false,
}: ConfirmModalProps) {
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (isOpen) cancelRef.current?.focus()
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onCancel])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Scrim */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="relative w-full max-w-sm bg-(--admin-surface) border border-(--admin-border) rounded-lg shadow-xl p-5"
      >
        {/* Close */}
        <button
          onClick={onCancel}
          className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-md text-(--admin-text-muted) hover:bg-(--admin-surface-2) hover:text-(--admin-text) transition-colors"
          aria-label="Close"
        >
          <BiX size={16} />
        </button>

        {/* Icon + Title */}
        <div className="flex items-start gap-3 mb-3">
          {dangerous && (
            <div className="w-8 h-8 rounded-full bg-(--admin-red-bg) flex items-center justify-center shrink-0 mt-0.5">
              <BiErrorAlt size={16} className="text-(--admin-red)" />
            </div>
          )}
          <div>
            <h2 id="confirm-title" className="text-[14px] font-semibold text-(--admin-text)">
              {title}
            </h2>
            <p className="text-[12px] text-(--admin-text-soft) mt-1 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 justify-end mt-4">
          <button
            ref={cancelRef}
            onClick={onCancel}
            className="h-8 px-4 text-[12px] font-medium text-(--admin-text-soft) bg-(--admin-surface-2) border border-(--admin-border) rounded-md hover:bg-(--admin-border) transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`h-8 px-4 text-[12px] font-medium rounded-md transition-colors ${
              dangerous
                ? 'bg-(--admin-red) text-white hover:opacity-90'
                : 'bg-(--admin-accent) text-(--admin-accent-text) hover:opacity-90'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

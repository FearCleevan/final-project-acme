'use client'

import { BiLogOut, BiX } from 'react-icons/bi'

export default function LogoutModal({ onConfirm, onCancel, loading }: {
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}) {
  return (
    <div className="fixed inset-0 z-999 flex items-center justify-center p-4">
      {/* Scrim */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />

      {/* Panel */}
      <div className="relative w-full max-w-sm bg-(--admin-surface) border border-(--admin-border) rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-(--admin-border)">
          <p className="text-[14px] font-semibold text-(--admin-text)">Log out</p>
          <button
            onClick={onCancel}
            className="w-6 h-6 flex items-center justify-center rounded-md text-(--admin-text-muted) hover:bg-(--admin-surface-2) transition-colors"
          >
            <BiX size={15} />
          </button>
        </div>

        <div className="px-5 py-5">
          <p className="text-[13px] text-(--admin-text-soft) leading-relaxed">
            Are you sure you want to log out of the admin dashboard?
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-(--admin-border)">
          <button
            onClick={onCancel}
            disabled={loading}
            className="h-8 px-4 text-[12px] font-medium text-(--admin-text-soft) bg-(--admin-surface-2) border border-(--admin-border) rounded-md hover:bg-(--admin-border) transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="h-8 px-4 text-[12px] font-medium text-white bg-(--admin-red) rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1.5"
          >
            {loading ? (
              <>
                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Logging out…
              </>
            ) : (
              <><BiLogOut size={13} /> Log out</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

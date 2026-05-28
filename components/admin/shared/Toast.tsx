'use client'

import { useEffect } from 'react'
import { BiCheck, BiX, BiErrorCircle } from 'react-icons/bi'

export type ToastType = 'success' | 'error'

interface Props {
  message: string
  type: ToastType
  onClose: () => void
  duration?: number
}

export default function Toast({ message, type, onClose, duration = 3500 }: Props) {
  useEffect(() => {
    const t = setTimeout(onClose, duration)
    return () => clearTimeout(t)
  }, [onClose, duration])

  const isSuccess = type === 'success'

  return (
    <div
      className="fixed z-9999 left-4 right-4 sm:left-auto sm:right-6 sm:w-auto sm:max-w-sm"
      style={{ top: 'calc(var(--admin-topbar-h) + 12px)' }}
    >
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border w-full"
        style={{
          background:  isSuccess ? '#f0fdf4' : '#fef2f2',
          borderColor: isSuccess ? '#16a34a' : '#dc2626',
          color:       isSuccess ? '#15803d' : '#dc2626',
        }}
      >
        {isSuccess
          ? <BiCheck size={18} className="shrink-0" />
          : <BiErrorCircle size={18} className="shrink-0" />
        }
        <p className="text-[13px] font-medium flex-1">{message}</p>
        <button
          onClick={onClose}
          className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
          aria-label="Dismiss"
        >
          <BiX size={16} />
        </button>
      </div>
    </div>
  )
}

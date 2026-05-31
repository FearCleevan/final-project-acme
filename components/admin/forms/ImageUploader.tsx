'use client'

import { useRef, useState } from 'react'
import { BiImageAdd, BiX, BiLoaderAlt, BiGridAlt } from 'react-icons/bi'

interface Props {
  images: string[]
  onChange: (images: string[]) => void
}

export default function ImageUploader({ images, onChange }: Props) {
  const inputRef                  = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [dragIdx,   setDragIdx]   = useState<number | null>(null)
  const [overIdx,   setOverIdx]   = useState<number | null>(null)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setError(null)
    setUploading(true)
    try {
      const uploaded: string[] = []
      for (const file of Array.from(files)) {
        const form = new FormData()
        form.append('file', file)
        const res = await fetch('/api/admin/products/upload', { method: 'POST', body: form })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error ?? 'Upload failed')
        }
        const { url } = await res.json()
        uploaded.push(url)
      }
      onChange([...images, ...uploaded])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    // Only handle file drops on the upload zone (not image reorders)
    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files)
  }

  function removeImage(idx: number) {
    onChange(images.filter((_, i) => i !== idx))
  }

  // ── Drag-to-reorder handlers ──────────────────────────────────────────────

  function onDragStart(e: React.DragEvent, idx: number) {
    setDragIdx(idx)
    e.dataTransfer.effectAllowed = 'move'
    // Transparent ghost — we style the original ourselves
    const ghost = document.createElement('div')
    ghost.style.cssText = 'position:absolute;top:-9999px'
    document.body.appendChild(ghost)
    e.dataTransfer.setDragImage(ghost, 0, 0)
    setTimeout(() => document.body.removeChild(ghost), 0)
  }

  function onDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (idx !== dragIdx) setOverIdx(idx)
  }

  function onDrop(e: React.DragEvent, dropIdx: number) {
    e.preventDefault()
    if (dragIdx === null || dragIdx === dropIdx) {
      setDragIdx(null)
      setOverIdx(null)
      return
    }
    const next = [...images]
    const [moved] = next.splice(dragIdx, 1)
    next.splice(dropIdx, 0, moved)
    onChange(next)
    setDragIdx(null)
    setOverIdx(null)
  }

  function onDragEnd() {
    setDragIdx(null)
    setOverIdx(null)
  }

  return (
    <div>
      {/* Upload zone */}
      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => !uploading && inputRef.current?.click()}
        className="border-2 border-dashed border-(--admin-border) rounded-md p-6 text-center cursor-pointer hover:border-(--admin-accent)/30 transition-colors"
      >
        {uploading ? (
          <>
            <BiLoaderAlt size={22} className="mx-auto mb-2 text-(--admin-accent) animate-spin" />
            <p className="text-[12px] text-(--admin-text-soft)">Uploading to Shopify…</p>
          </>
        ) : (
          <>
            <BiImageAdd size={22} className="mx-auto mb-2 text-(--admin-text-muted)" />
            <p className="text-[12px] text-(--admin-text-soft)">Drop images here or click to upload</p>
            <p className="text-[10px] text-(--admin-text-muted) mt-0.5">
              Images are uploaded directly to Shopify CDN
            </p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={e => handleFiles(e.target.files)}
        />
      </div>

      {error && (
        <p className="text-[11px] text-(--admin-red) mt-2">{error}</p>
      )}

      {images.length > 0 && (
        <>
          <p className="text-[10px] text-(--admin-text-muted) mt-3 mb-2">
            Drag to reorder · first image is the main photo
          </p>
          <div className="grid grid-cols-5 gap-2">
            {images.map((src, i) => (
              <div
                key={src + i}
                draggable
                onDragStart={e => onDragStart(e, i)}
                onDragOver={e => onDragOver(e, i)}
                onDrop={e => onDrop(e, i)}
                onDragEnd={onDragEnd}
                className={[
                  'relative group aspect-square rounded-md border transition-all duration-150 cursor-grab active:cursor-grabbing select-none',
                  dragIdx === i
                    ? 'opacity-40 scale-95 border-(--admin-accent)'
                    : overIdx === i
                      ? 'border-(--admin-accent) ring-2 ring-(--admin-accent)/30 scale-[1.03]'
                      : 'border-(--admin-border)',
                ].join(' ')}
              >
                <img
                  src={src}
                  alt=""
                  draggable={false}
                  className="w-full h-full object-cover rounded-md"
                />

                {/* Drag handle */}
                <div className="absolute inset-x-0 top-0 flex justify-center pt-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="bg-black/50 rounded px-1 py-0.5">
                    <BiGridAlt size={11} className="text-white" />
                  </div>
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove image"
                >
                  <BiX size={12} className="text-white" />
                </button>

                {/* Main badge — always on first slot */}
                {i === 0 && (
                  <span className="absolute bottom-1 left-1 text-[9px] bg-black/50 text-white px-1 rounded">
                    Main
                  </span>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

'use client'

import { useRef, useState } from 'react'
import { BiImageAdd, BiX, BiLoaderAlt } from 'react-icons/bi'

interface Props {
  images: string[]
  onChange: (images: string[]) => void
}

export default function ImageUploader({ images, onChange }: Props) {
  const inputRef               = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error,     setError]     = useState<string | null>(null)

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
    handleFiles(e.dataTransfer.files)
  }

  function removeImage(idx: number) {
    onChange(images.filter((_, i) => i !== idx))
  }

  return (
    <div>
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
        <div className="mt-3 grid grid-cols-5 gap-2">
          {images.map((src, i) => (
            <div key={i} className="relative group aspect-square">
              <img
                src={src}
                alt=""
                className="w-full h-full object-cover rounded-md border border-(--admin-border)"
              />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove image"
              >
                <BiX size={12} className="text-white" />
              </button>
              {i === 0 && (
                <span className="absolute bottom-1 left-1 text-[9px] bg-black/50 text-white px-1 rounded">
                  Main
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

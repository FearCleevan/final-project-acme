'use client'

import { useRef } from 'react'
import { BiImageAdd, BiX } from 'react-icons/bi'

interface Props {
  images: string[]
  onChange: (images: string[]) => void
}

export default function ImageUploader({ images, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFiles(files: FileList | null) {
    if (!files) return
    const urls = Array.from(files).map(f => URL.createObjectURL(f))
    onChange([...images, ...urls])
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
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-(--admin-border) rounded-md p-6 text-center cursor-pointer hover:border-(--admin-accent)/30 transition-colors"
      >
        <BiImageAdd size={22} className="mx-auto mb-2 text-(--admin-text-muted)" />
        <p className="text-[12px] text-(--admin-text-soft)">Drop images here or click to upload</p>
        <p className="text-[10px] text-(--admin-text-muted) mt-0.5">
          Plan 1: preview only — image upload syncs to Shopify in Plan 2
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={e => handleFiles(e.target.files)}
        />
      </div>

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

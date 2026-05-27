'use client'

import { mockCollections } from '@/lib/admin/mockData'

interface Props {
  value: string[]
  onChange: (collections: string[]) => void
}

export default function CollectionSelect({ value, onChange }: Props) {
  function toggle(handle: string) {
    if (value.includes(handle)) {
      onChange(value.filter(h => h !== handle))
    } else {
      onChange([...value, handle])
    }
  }

  return (
    <div className="space-y-2">
      {mockCollections.map(col => (
        <label
          key={col.handle}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <input
            type="checkbox"
            checked={value.includes(col.handle)}
            onChange={() => toggle(col.handle)}
            className="w-3.5 h-3.5 rounded border-(--admin-border) accent-(--admin-accent) cursor-pointer"
          />
          <span className="text-[13px] text-(--admin-text-soft) group-hover:text-(--admin-text) transition-colors">
            {col.title}
          </span>
        </label>
      ))}
    </div>
  )
}

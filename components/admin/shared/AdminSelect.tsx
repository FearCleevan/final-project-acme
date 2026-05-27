'use client'

import * as Select from '@radix-ui/react-select'
import { BiChevronDown, BiCheck } from 'react-icons/bi'
import { cn } from '@/lib/utils'

export interface SelectOption {
  value: string
  label: string
}

interface AdminSelectProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  className?: string
  placeholder?: string
}

export default function AdminSelect({ value, onChange, options, className, placeholder }: AdminSelectProps) {
  return (
    <Select.Root value={value} onValueChange={onChange}>
      <Select.Trigger
        className={cn(
          'flex items-center justify-between gap-2 h-8 px-3 text-[12px] text-(--admin-text-soft)',
          'bg-(--admin-surface-2) border border-(--admin-border) rounded-md',
          'focus:outline-none focus:border-(--admin-accent) focus:ring-1 focus:ring-(--admin-accent)/10',
          'hover:bg-(--admin-border) transition-colors cursor-pointer select-none overflow-hidden',
          className
        )}
      >
        <span className="truncate min-w-0">
          <Select.Value placeholder={placeholder} />
        </span>
        <Select.Icon className="shrink-0">
          <BiChevronDown size={14} className="text-(--admin-text-muted)" />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          position="popper"
          sideOffset={4}
          align="start"
          avoidCollisions
          className={cn(
            'z-[9999] min-w-[var(--radix-select-trigger-width)]',
            'bg-(--admin-surface) border border-(--admin-border) rounded-md shadow-lg',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          )}
        >
          <Select.Viewport className="p-1">
            {options.map(opt => (
              <Select.Item
                key={opt.value}
                value={opt.value}
                className={cn(
                  'flex items-center justify-between gap-3 px-3 py-2 rounded-sm text-[12px] cursor-pointer select-none outline-none',
                  'text-(--admin-text-soft) hover:bg-(--admin-surface-2) hover:text-(--admin-text)',
                  'data-[highlighted]:bg-(--admin-surface-2) data-[highlighted]:text-(--admin-text)',
                  'data-[state=checked]:text-(--admin-accent) data-[state=checked]:font-medium',
                )}
              >
                <Select.ItemText>{opt.label}</Select.ItemText>
                <Select.ItemIndicator>
                  <BiCheck size={13} className="text-(--admin-accent)" />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  )
}

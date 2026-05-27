import { BiBox } from 'react-icons/bi'

interface EmptyStateProps {
  message?: string
  description?: string
}

export default function EmptyState({
  message = 'No results found',
  description = 'Try adjusting your filters or search query.',
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <BiBox size={32} className="text-(--admin-text-muted) mb-3" />
      <p className="text-[14px] font-medium text-(--admin-text-soft)">{message}</p>
      <p className="text-[12px] text-(--admin-text-muted) mt-1">{description}</p>
    </div>
  )
}

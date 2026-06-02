import Breadcrumb from '@/components/shared/Breadcrumb'

interface CatalogHeaderProps {
  title?: string
  crumbs?: { label: string; href?: string }[]
}

export default function CatalogHeader({
  title = 'The Full Catalog',
  crumbs = [{ label: 'Storefront', href: '/' }, { label: 'Catalog' }],
}: CatalogHeaderProps) {
  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-8 pb-6 border-b border-ink-rule">
      <Breadcrumb crumbs={crumbs} className="mb-3" />
      <h1 className="font-serif font-bold text-[28px] sm:text-[32px] text-ink-charcoal leading-tight">
        {title}
      </h1>
    </div>
  )
}

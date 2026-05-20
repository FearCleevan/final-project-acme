import Breadcrumb from '@/components/shared/Breadcrumb'
import Eyebrow from '@/components/shared/Eyebrow'

export default function CatalogHeader() {
  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-10 sm:pt-12 pb-8 sm:pb-10 border-b border-ink-rule">
      <Breadcrumb
        crumbs={[{ label: 'Storefront', href: '/' }, { label: 'Catalog' }]}
        className="mb-6"
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-end">
        <div>
          <Eyebrow className="mb-3">Spring Release · 50 Pieces</Eyebrow>
          <h1
            className="font-serif font-medium text-ink-charcoal leading-tight"
            style={{ fontSize: 'clamp(36px, 4vw, 60px)' }}
          >
            The Full Catalog.
          </h1>
        </div>
        <p className="font-sans text-[17px] text-ink-soft leading-relaxed max-w-[44ch]">
          Filter by burner size, material, or collection. Every piece has been hand-numbered,
          bench-tested, and packed in straw — there is no second batch.
        </p>
      </div>
    </div>
  )
}

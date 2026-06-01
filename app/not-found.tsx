import Link from 'next/link'
import Eyebrow from '@/components/shared/Eyebrow'
import Button from '@/components/shared/Button'

export default function NotFound() {
  return (
    <div className="bg-parchment min-h-screen flex flex-col items-center justify-center px-6 py-24 text-center">

      {/* Decorative number */}
      <p
        className="font-serif font-medium text-parchment-3 select-none leading-none pointer-events-none"
        style={{ fontSize: 'clamp(120px, 24vw, 240px)' }}
        aria-hidden="true"
      >
        404
      </p>

      <div className="-mt-6 relative z-10">
        <Eyebrow className="mb-5">Page not found</Eyebrow>

        <h1
          className="font-serif font-medium text-ink-charcoal leading-tight mb-6"
          style={{ fontSize: 'clamp(28px, 4vw, 52px)' }}
        >
          This wick has burned out.
        </h1>

        <p className="font-sans text-[17px] text-ink-soft leading-relaxed mb-10 max-w-[44ch] mx-auto">
          The page you&rsquo;re looking for has been moved, removed, or never existed.
          The catalog is still lit — try starting there.
        </p>

        <div className="flex flex-wrap gap-4 justify-center">
          <Button href="/catalog" variant="primary">Walk the catalog →</Button>
          <Button href="/" variant="ghost">Back to storefront</Button>
        </div>
      </div>

    </div>
  )
}

import Link from 'next/link'
import PlateImage from '@/components/shared/PlateImage'
import Eyebrow from '@/components/shared/Eyebrow'
import Button from '@/components/shared/Button'
import storyData from '@/data/story.json'

export default function OurStoryPage() {
  return (
    <div className="bg-parchment min-h-screen">

      {/* Hero */}
      <section className="px-6 pt-20 pb-24">
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-20 items-center">

          {/* Left text */}
          <div>
            <Eyebrow className="mb-5">Our story</Eyebrow>
            <h1
              className="font-serif font-medium text-ink-charcoal leading-[0.96] mb-7"
              style={{ fontSize: 'clamp(36px, 5vw, 72px)' }}
            >
              A family that{' '}
              <em className="text-brass-deep not-italic italic">refused to</em>{' '}
              turn off the light.
            </h1>
            <p className="font-sans text-[18px] text-ink-soft leading-relaxed max-w-[52ch]">
              Most companies that made kerosene lamps shut their doors a hundred years ago. We never did.
              This is the story of why.
            </p>
          </div>

          {/* Right plate */}
          <div className="relative">
            <PlateImage
              alt="Workshop exterior, Pune press shop"
              aspectRatio="4/5"
              dark={false}
              label="EST. 1898 / PUNE · NOW IN NORTH AMERICA"
              priority
              className="rounded-sm"
            />
          </div>

        </div>
      </section>

      {/* Mission statement */}
      <section className="border-t border-ink-rule px-6 py-24 bg-parchment-2">
        <div className="max-w-[900px] mx-auto text-center">
          <Eyebrow className="mb-5">Our mission, in plain words</Eyebrow>
          <blockquote
            className="font-serif font-medium text-ink-charcoal leading-tight mb-10"
            style={{ fontSize: 'clamp(22px, 2.8vw, 36px)' }}
          >
            "We make lamps the way they were made when lamps mattered — by hand, on the same dies,
            with no pretense that we've improved on the originals."
          </blockquote>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left max-w-[720px] mx-auto">
            <p className="font-sans text-[16px] text-ink-soft leading-relaxed">
              The Patel family has operated the same press shop in Pune since 1898. The dies have not been
              recut. The alloy specification has not changed. The eight-hour burn test has never been
              reduced to four.
            </p>
            <p className="font-sans text-[16px] text-ink-soft leading-relaxed">
              These pieces have been distributed through our partners in Australia for over two decades.
              Now, for the first time, they are available here — in North America. The workshop in Pune
              stays exactly where it was. It always will.
            </p>
          </div>
        </div>
      </section>

      {/* Three pillars */}
      <section className="px-6 py-24 border-t border-ink-rule">
        <div className="max-w-[1280px] mx-auto">
          <Eyebrow className="mb-4">Three things we believe</Eyebrow>
          <h2
            className="font-serif font-medium text-ink-charcoal leading-tight mb-14"
            style={{ fontSize: 'clamp(24px, 3vw, 42px)' }}
          >
            What we'll do for you, and what we won't.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {storyData.pillars.map(({ n, title, body }) => (
              <div key={n} className="border-t-2 border-brass-deep pt-6">
                <span className="font-mono text-[11px] text-brass-deep tracking-eyebrow block mb-3">{n}</span>
                <h3 className="font-serif text-[20px] text-ink-charcoal font-medium mb-3 leading-snug">
                  {title}
                </h3>
                <p className="font-sans text-[15px] text-ink-soft leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dark testimonial */}
      <section className="canvas-dark px-6 py-24">
        <div className="max-w-[760px] mx-auto">
          <span className="font-serif text-[72px] text-brass leading-none block mb-4" aria-hidden="true">"</span>
          <blockquote className="font-serif italic text-[22px] text-canvas-body leading-relaxed mb-8">
            My grandfather bought the press shop for a hundred and forty rupees and a promise.
            The promise was that we would still be running the same dies in a hundred years.
            We are. The next hundred is paid for.
          </blockquote>
          <footer className="font-mono text-[11px] uppercase tracking-eyebrow text-canvas-dim">
            R.K. Patel &nbsp;/&nbsp; Third-generation press operator · Pune, India
          </footer>
        </div>
      </section>

      {/* Read on */}
      <section className="px-6 py-20 border-t border-ink-rule">
        <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
          <div>
            <Eyebrow className="mb-3">More of the workshop</Eyebrow>
            <h2
              className="font-serif font-medium text-ink-charcoal"
              style={{ fontSize: 'clamp(22px, 2.5vw, 36px)' }}
            >
              Walk the full history.
            </h2>
          </div>
          <div className="flex flex-wrap gap-4">
            <Button href="/heritage" variant="primary">The full heritage timeline →</Button>
            <Button href="/catalog" variant="ghost">Walk the catalog</Button>
          </div>
        </div>
      </section>

    </div>
  )
}

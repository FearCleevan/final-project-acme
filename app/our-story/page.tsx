import type { Metadata } from 'next'
import Link from 'next/link'
import PlateImage from '@/components/shared/PlateImage'
import Eyebrow from '@/components/shared/Eyebrow'
import Button from '@/components/shared/Button'
import { getContent } from '@/lib/content'
import type { StoryContent } from '@/lib/types/content'
import storyData from '@/data/story.json'

export const metadata: Metadata = {
  title: 'Our Story — Acme Vintage Supply',
  description: 'The story behind Acme Vintage Supply — original Birmingham tooling, borosilicate glass, and over two decades of supplying collectors. Now available in North America.',
  alternates: { canonical: '/our-story' },
}

const FALLBACK: StoryContent = {
  headline: 'A family that refused to turn off the light.',
  intro:    'Most companies that made kerosene lamps shut their doors a hundred years ago. This is the story of why.',
  imageUrl: '',
  pillars:  storyData.pillars,
}

export default async function OurStoryPage() {
  const story = (await getContent<StoryContent>('story')) ?? FALLBACK

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
              {story.headline}
            </h1>
            <p className="font-sans text-[18px] text-ink-soft leading-relaxed max-w-[52ch]">
              {story.intro}
            </p>
          </div>

          {/* Right plate */}
          <div className="relative">
            <PlateImage
              src={story.imageUrl || undefined}
              alt="Original oil lamp workshop — Melbourne, Australia"
              aspectRatio="4/5"
              dark={false}
              label="MELBOURNE WORKSHOP · NOW IN NORTH AMERICA"
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
              The original Birmingham tooling used to press our Duplex burners is over a century old. The
              dies have not been recut. The borosilicate glass formula for our shades and chimneys has not
              been reformulated. The brass alloy has not been changed for cost.
            </p>
            <p className="font-sans text-[16px] text-ink-soft leading-relaxed">
              These pieces have supplied collectors in Australia for over two decades. Now, for the first
              time, they are available in North America. The tooling stays exactly where it was. It always will.
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
            {story.pillars.map(({ n, title, body }) => (
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
            We were offered the original tooling and dies — over a hundred years old — and we said yes.
            We shipped them to Melbourne, set them up, and started making Duplex burners again.
            That's the whole story, really. The rest is just keeping the presses running.
          </blockquote>
          <footer className="font-mono text-[11px] uppercase tracking-eyebrow text-canvas-dim">
            The Oil Lamp Company &nbsp;/&nbsp; Melbourne, Australia
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

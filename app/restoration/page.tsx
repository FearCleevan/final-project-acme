import Breadcrumb from '@/components/shared/Breadcrumb'
import Eyebrow from '@/components/shared/Eyebrow'
import Button from '@/components/shared/Button'

const services = [
  {
    n: '01',
    title: 'Burner replacement & fitting',
    body: "We source period-correct burners from our OLC inventory and fit them to your existing lamp body. The fitting is adjusted by hand on the bench, not by spec sheet. Turnaround: 5–7 working days from receipt.",
    price: 'From $45',
  },
  {
    n: '02',
    title: 'Chimney matching',
    body: "Bring us a broken chimney and we will match the diameter, height, and collar profile from our glass inventory. If we cannot match it exactly, we will tell you so before you send the lamp. No guessing, no substitutes presented as equivalents.",
    price: 'From $28',
  },
  {
    n: '03',
    title: 'Font cleaning & resealing',
    body: "Oxidised kerosene leaves a varnish residue that blocks wick feed and causes uneven burning. We flush the font, dissolve the residue, and reseal the filler collar. The lamp leaves the bench burning cleanly on a full 8-hour test wick.",
    price: 'From $60',
  },
  {
    n: '04',
    title: 'Full lamp restoration',
    body: "Complete strip-down, cleaning, part replacement where required, and reassembly. Every restored lamp leaves the bench with a new wick, a matched chimney, and a bench test certificate. We photograph the process and include the record with the lamp.",
    price: 'From $120',
  },
  {
    n: '05',
    title: 'Sign restoration',
    body: "Porcelain advertising signs can be cleaned of surface oxidation and edge chipping can be stabilised. We do not repaint or refire — if the enamel is gone, we say so. Conservation, not falsification.",
    price: 'Quoted per piece',
  },
]

export default function RestorationPage() {
  return (
    <div className="bg-parchment min-h-screen">
      <div className="max-w-[1000px] mx-auto px-6 py-14">

        <Breadcrumb
          crumbs={[{ label: 'Storefront', href: '/' }, { label: 'Restoration Services' }]}
          className="mb-10"
        />

        <Eyebrow className="mb-4">The bench</Eyebrow>
        <h1
          className="font-serif font-medium text-ink-charcoal leading-tight mb-4"
          style={{ fontSize: 'clamp(28px, 4vw, 52px)' }}
        >
          Restoration services.
        </h1>
        <p className="font-sans text-[17px] text-ink-soft leading-relaxed mb-16 max-w-[58ch]">
          We restore lamps we did not sell. If it burns kerosene and something is wrong with it,
          bring it to the bench. We will tell you honestly what can be fixed and what cannot.
        </p>

        {/* Services */}
        <div className="border-t border-ink-rule divide-y divide-ink-rule mb-16">
          {services.map(({ n, title, body, price }) => (
            <div key={n} className="py-8 grid grid-cols-1 sm:grid-cols-[1fr_120px] gap-5 items-start">
              <div className="flex gap-6 items-start">
                <span className="font-mono text-[11px] uppercase tracking-eyebrow text-brass-deep pt-1 shrink-0">{n}</span>
                <div>
                  <h2 className="font-serif text-[20px] font-medium text-ink-charcoal mb-3 leading-snug">{title}</h2>
                  <p className="font-sans text-[15px] text-ink-soft leading-relaxed">{body}</p>
                </div>
              </div>
              <div className="sm:text-right pl-10 sm:pl-0">
                <span className="font-serif text-[18px] text-brass-deep">{price}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Process */}
        <div className="bg-parchment-2 border border-ink-rule rounded-sm p-8 mb-16">
          <Eyebrow className="mb-4">How it works</Eyebrow>
          <ol className="space-y-4">
            {[
              'Pack your lamp carefully and post it to our Nova Scotia workshop with a note describing what is wrong.',
              'We inspect it on arrival and send you a written quote within two working days.',
              'You approve the quote. We do the work. No surprises added after the fact.',
              'We post it back, insured, straw-packed. You receive a bench test record with the lamp.',
            ].map((step, i) => (
              <li key={i} className="flex gap-4 items-start">
                <span className="font-mono text-[11px] text-brass-deep tracking-eyebrow pt-0.5 shrink-0">
                  {String(i + 1).padStart(2, '0')}.
                </span>
                <p className="font-sans text-[15px] text-ink-soft leading-relaxed">{step}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="flex flex-wrap gap-4">
          <Button href="/contact" variant="primary">Send us a note first</Button>
          <Button href="/guides" variant="ghost">Read the lighting guide</Button>
        </div>

      </div>
    </div>
  )
}

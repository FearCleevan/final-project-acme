import Breadcrumb from '@/components/shared/Breadcrumb'
import Eyebrow from '@/components/shared/Eyebrow'
import Button from '@/components/shared/Button'

const sections = [
  {
    n: '01',
    title: 'Choosing the right burner size',
    body: [
      'Burner sizes are not interchangeable. A No. 1 burner takes a 7/8-inch wick and is suited to smaller table lamps and lanterns. A No. 2 takes a 1-inch wick and is the most common size in our catalog — it produces a steady, wide flame suitable for reading or a full room. A No. 3 takes a 1¼-inch wick and is intended for large parlour lamps and hanging fixtures.',
      'Universal burners accept most wick widths and are designed for repair use when the original burner size is unknown. They perform adequately but are not a substitute for a correctly sized burner in a purpose-built lamp.',
    ],
  },
  {
    n: '02',
    title: 'Trimming the wick',
    body: [
      'A poorly trimmed wick is the single most common cause of a smoking flame. Trim the wick flat, or with a very slight centre peak, before each lighting. Cut off any charred edges. The trimmed face should be clean cotton — no brown, no black.',
      'Wick trimmers are not optional. Scissors leave a straight cut that tends to split at the edges and produce ragged burning. A proper wick trimmer cuts in a convex arc that holds the cotton together. We include one with every lamp purchase.',
    ],
  },
  {
    n: '03',
    title: 'Filling the font',
    body: [
      'Use only clean, water-clear kerosene. Dyed kerosene (red, pink) is taxed for off-road use and contains additives that accelerate wick fouling and deposit soot on chimneys. Clear kerosene burns cleaner and longer.',
      'Fill to no more than three-quarters of font capacity. A full font leaves no expansion room as the kerosene warms; the resulting pressure can force fuel up the wick tube and cause a flare. Allow the wick to absorb fuel for at least five minutes before lighting.',
    ],
  },
  {
    n: '04',
    title: 'Lighting and flame height',
    body: [
      'Light with a long match or a butane lighter — never a short match that requires you to hold your hand inside the chimney. Raise the wick no more than 3mm above the burner collar for the first ten minutes while the glass chimney heats evenly.',
      'Once the chimney is warm, you can raise the flame to your preferred height. A properly adjusted flame produces a steady, slightly pointed top with no flickering and no black smoke. If you see smoke, lower the wick. If the flame is flat and produces a yellow haze, raise it slightly.',
    ],
  },
  {
    n: '05',
    title: 'Chimney care',
    body: [
      'Kerosene lamp chimneys accumulate a thin film of carbon on the interior over several hours of use. This is normal. Clean with a dry cotton cloth while the chimney is still faintly warm — the deposit wipes off cleanly at this temperature and becomes more stubborn when cold.',
      'Never immerse a hot chimney in cold water. Thermal shock will crack even thick glass. Never place a cold chimney on a hot burner for the same reason. If a chimney is too hot to hold comfortably, let it cool for ten minutes before handling.',
    ],
  },
  {
    n: '06',
    title: 'Storage between seasons',
    body: [
      'Empty the font completely before storage. Kerosene left in a lamp over summer will oxidise and leave a varnish-like residue on the interior of the font and the lower wick. This residue blocks the wick pores and causes uneven burning when the lamp is relit months later.',
      'Store wicks dry, in paper, not plastic. Cotton wicks absorb moisture in sealed plastic bags and deteriorate. A dry wick stored in a drawer will outlast a damp wick stored in an airtight container.',
    ],
  },
]

export default function GuidesPage() {
  return (
    <div className="bg-parchment min-h-screen">
      <div className="max-w-[900px] mx-auto px-6 py-14">

        <Breadcrumb
          crumbs={[{ label: 'Storefront', href: '/' }, { label: 'Lamp-Lighting Guide' }]}
          className="mb-10"
        />

        <Eyebrow className="mb-4">The workshop guide</Eyebrow>
        <h1
          className="font-serif font-medium text-ink-charcoal leading-tight mb-4"
          style={{ fontSize: 'clamp(28px, 4vw, 52px)' }}
        >
          How to light a kerosene lamp correctly.
        </h1>
        <p className="font-sans text-[17px] text-ink-soft leading-relaxed mb-16 max-w-[58ch]">
          Written from the bench. No photographs of lifestyle candles. No advice sourced from forums.
          This is what we tell customers who call us when something is not right.
        </p>

        <div className="space-y-14">
          {sections.map(({ n, title, body }) => (
            <section key={n} className="border-t border-ink-rule pt-10">
              <div className="flex gap-6 items-start">
                <span className="font-mono text-[11px] uppercase tracking-eyebrow text-brass-deep pt-1.5 shrink-0 w-6">
                  {n}
                </span>
                <div>
                  <h2 className="font-serif text-[22px] font-medium text-ink-charcoal mb-5 leading-snug">
                    {title}
                  </h2>
                  <div className="space-y-4">
                    {body.map((para, i) => (
                      <p key={i} className="font-sans text-[16px] text-ink-soft leading-relaxed">
                        {para}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          ))}
        </div>

        <div className="border-t border-ink-rule mt-16 pt-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <p className="font-serif text-[18px] text-ink-charcoal font-medium mb-1">
              Still have a question?
            </p>
            <p className="font-sans text-[14px] text-ink-soft">
              Call us or write — we answer lamp questions ourselves.
            </p>
          </div>
          <Button href="/contact" variant="brass">Contact the workshop</Button>
        </div>

      </div>
    </div>
  )
}

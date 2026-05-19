import Breadcrumb from '@/components/shared/Breadcrumb'
import Eyebrow from '@/components/shared/Eyebrow'
import ContactForm from '@/components/contact/ContactForm'
import AddressCards from '@/components/contact/AddressCards'

export default function ContactPage() {
  return (
    <div className="bg-parchment min-h-screen">

      {/* Hero */}
      <section className="px-6 pt-14 pb-20 border-b border-ink-rule">
        <div className="max-w-[1280px] mx-auto">
          <Breadcrumb
            crumbs={[
              { label: 'Storefront', href: '/' },
              { label: 'Contact' },
            ]}
            className="mb-10"
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-20 items-center">

            {/* Heading */}
            <div>
              <Eyebrow className="mb-5">Contact</Eyebrow>
              <h1
                className="font-serif font-medium text-ink-charcoal leading-[1.05] mb-8"
                style={{ fontSize: 'clamp(36px, 5vw, 68px)' }}
              >
                A real phone.<br />
                A real person.<br />
                <em className="text-brass-deep">A real answer.</em>
              </h1>
            </div>

            {/* Body */}
            <div>
              <p className="font-sans text-[18px] text-ink-soft leading-relaxed max-w-[50ch]">
                We don't do support tickets. We do conversations. If your chimney cracked, your burner
                won't draw, or you can't tell a No. 1 from a No. 2 — call us, write us, or come down
                to Pirie Street.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Form + addresses */}
      <section className="px-6 py-20">
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-10 xl:gap-16 items-start">

          <ContactForm />

          <AddressCards />

        </div>
      </section>

    </div>
  )
}

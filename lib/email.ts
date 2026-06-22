import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)

const FROM = 'Acme Vintage Supply <hello@acmevintagesupply.ca>'
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://acmevintagesupply.com'

export async function sendBackInStockEmail(
  to:            string,
  productTitle:  string,
  productHandle: string
): Promise<void> {
  await resend.emails.send({
    from:    FROM,
    to,
    subject: `Back in stock: ${productTitle}`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #2C2C2A;">
        <h2 style="font-size: 22px; font-weight: 600; margin-bottom: 8px;">Good news from the bench.</h2>
        <p style="font-size: 15px; line-height: 1.6; color: #6B6257; margin-bottom: 24px;">
          <strong style="color: #2C2C2A;">${productTitle}</strong> is back in stock at Acme Vintage Supply.
          These pieces move quickly — grab yours before it goes again.
        </p>
        <a
          href="${SITE}/catalog/${productHandle}"
          style="display: inline-block; background: #2C5F2E; color: #F5F1E6; text-decoration: none;
                 padding: 12px 28px; border-radius: 3px; font-family: sans-serif; font-size: 14px; font-weight: 600;"
        >
          View product →
        </a>
        <p style="font-size: 12px; color: #A89F94; margin-top: 32px; line-height: 1.5;">
          You requested a restock notification for this item. If you no longer need it, simply ignore this email.<br>
          Acme Vintage Supply · Dartmouth, Nova Scotia
        </p>
      </div>
    `,
  })
}

export async function sendPackedAtWorkshopEmail(
  to:        string,
  orderName: string
): Promise<void> {
  await resend.emails.send({
    from:    FROM,
    to,
    subject: `Your order ${orderName} is being packed`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #2C2C2A;">
        <h2 style="font-size: 22px; font-weight: 600; margin-bottom: 8px;">Your order is at the bench.</h2>
        <p style="font-size: 15px; line-height: 1.6; color: #6B6257; margin-bottom: 24px;">
          Order <strong style="color: #2C2C2A;">${orderName}</strong> is being straw-packed and hand-numbered by our bench team.
          You'll receive another email with tracking information once it ships.
        </p>
        <a
          href="${SITE}/track-order?order=${encodeURIComponent(orderName)}"
          style="display: inline-block; background: #2C5F2E; color: #F5F1E6; text-decoration: none;
                 padding: 12px 28px; border-radius: 3px; font-family: sans-serif; font-size: 14px; font-weight: 600;"
        >
          Track your order →
        </a>
        <p style="font-size: 12px; color: #A89F94; margin-top: 32px; line-height: 1.5;">
          Acme Vintage Supply · Dartmouth, Nova Scotia
        </p>
      </div>
    `,
  })
}

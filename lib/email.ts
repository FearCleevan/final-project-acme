import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)

const FROM = 'Acme Vintage Supply <hello@acmevintagesupply.com>'
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://acmevintagesupply.com'

export type TemplateType = 'bench_notes' | 'new_arrivals' | 'seasonal_sale'

export interface NewsletterProduct {
  title:    string
  price:    string
  imageUrl: string
  handle:   string
}

export interface TemplateData {
  greeting?:     string
  products?:     NewsletterProduct[]
  headline?:     string
  discountCode?: string
  saleEndDate?:  string
}

interface NewsletterCampaign {
  subject:       string
  body:          string
  ctaLabel?:     string
  ctaUrl?:       string
  template?:     TemplateType
  templateData?: TemplateData
}

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

export async function sendNewOrderAdminAlert(order: {
  name:            string
  total:           string
  customer:        string
  email:           string
  items:           { title: string; quantity: number; price: string }[]
  shippingAddress: string
}): Promise<void> {
  const recipients = (process.env.ADMIN_EMAIL ?? '')
    .split(',')
    .map(e => e.trim())
    .filter(Boolean)
  if (!recipients.length) return

  const itemRows = order.items.map(i =>
    `<tr>
      <td style="padding:6px 0; font-size:13px; color:#2C2C2A; border-bottom:1px solid #E8E0D4;">${i.title}</td>
      <td style="padding:6px 0; font-size:13px; color:#6B6257; text-align:center; border-bottom:1px solid #E8E0D4;">×${i.quantity}</td>
      <td style="padding:6px 0; font-size:13px; color:#2C2C2A; text-align:right; border-bottom:1px solid #E8E0D4;">$${i.price}</td>
    </tr>`
  ).join('')

  await resend.emails.send({
    from:    FROM,
    to:      recipients,
    subject: `New order ${order.name} — $${order.total} CAD`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #2C2C2A;">
        <div style="background:#2C5F2E; padding:20px 28px; border-radius:8px 8px 0 0;">
          <p style="color:#F5F1E6; font-size:11px; font-family:sans-serif; letter-spacing:2px; text-transform:uppercase; margin:0 0 4px;">New Order Received</p>
          <h1 style="color:#F5F1E6; font-size:24px; font-weight:700; margin:0;">${order.name}</h1>
        </div>
        <div style="background:#FDFAF6; border:1px solid #E8E0D4; border-top:none; padding:24px 28px; border-radius:0 0 8px 8px;">
          <table style="width:100%; border-collapse:collapse; margin-bottom:20px;">
            <tr>
              <td style="font-size:12px; color:#A89F94; font-family:sans-serif; text-transform:uppercase; letter-spacing:1px; padding-bottom:4px;">Customer</td>
              <td style="font-size:12px; color:#A89F94; font-family:sans-serif; text-transform:uppercase; letter-spacing:1px; padding-bottom:4px; text-align:right;">Order Total</td>
            </tr>
            <tr>
              <td style="font-size:15px; color:#2C2C2A; font-weight:600;">${order.customer}</td>
              <td style="font-size:22px; color:#2C5F2E; font-weight:700; text-align:right;">$${order.total} CAD</td>
            </tr>
            <tr>
              <td style="font-size:12px; color:#6B6257;">${order.email}</td>
              <td></td>
            </tr>
          </table>
          <p style="font-size:12px; color:#A89F94; font-family:sans-serif; margin:0 0 4px;">Ship to</p>
          <p style="font-size:13px; color:#2C2C2A; margin:0 0 20px;">${order.shippingAddress}</p>
          <table style="width:100%; border-collapse:collapse; margin-bottom:24px;">
            <thead>
              <tr>
                <th style="font-size:11px; color:#A89F94; font-family:sans-serif; text-align:left; padding-bottom:6px; border-bottom:2px solid #E8E0D4;">Item</th>
                <th style="font-size:11px; color:#A89F94; font-family:sans-serif; text-align:center; padding-bottom:6px; border-bottom:2px solid #E8E0D4;">Qty</th>
                <th style="font-size:11px; color:#A89F94; font-family:sans-serif; text-align:right; padding-bottom:6px; border-bottom:2px solid #E8E0D4;">Price</th>
              </tr>
            </thead>
            <tbody>${itemRows}</tbody>
          </table>
          <a
            href="https://acmevintagesupply.com/admin/orders/${order.name.replace('#', '')}"
            style="display:inline-block; background:#B8964E; color:#fff; text-decoration:none; padding:12px 28px; border-radius:6px; font-family:sans-serif; font-size:14px; font-weight:600;"
          >
            View order in admin →
          </a>
          <p style="font-size:11px; color:#A89F94; margin-top:20px;">Acme Vintage Supply · Dartmouth, Nova Scotia</p>
        </div>
      </div>
    `,
  })
}

export async function sendContactAdminAlert(msg: {
  name:    string
  email:   string
  subject: string
  message: string
}): Promise<void> {
  const raw        = process.env.ADMIN_EMAIL ?? ''
  const recipients = raw.split(',').map(e => e.trim()).filter(Boolean)
  if (!recipients.length) return

  await resend.emails.send({
    from:    FROM,
    to:      recipients,
    subject: `New contact: ${msg.subject} — ${msg.name}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#1C2B1E;border-radius:6px;overflow:hidden">
        <div style="background:#2C5F2E;padding:24px 32px">
          <h1 style="color:#F5F1E6;font-size:18px;margin:0;font-weight:700">New Contact Message</h1>
          <p style="color:#b8d4b9;font-size:13px;margin:4px 0 0">Acme Vintage Supply</p>
        </div>
        <div style="padding:28px 32px;background:#fff">
          <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
            <tr>
              <td style="padding:6px 0;color:#666;font-size:13px;width:80px;vertical-align:top">From</td>
              <td style="padding:6px 0;font-size:13px;color:#1C1C1C">${msg.name} &lt;${msg.email}&gt;</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#666;font-size:13px;vertical-align:top">Subject</td>
              <td style="padding:6px 0;font-size:13px;color:#1C1C1C">${msg.subject}</td>
            </tr>
          </table>
          <div style="background:#f5f5f5;border-left:3px solid #2C5F2E;padding:16px;border-radius:0 4px 4px 0">
            <p style="margin:0;font-size:14px;color:#3A3A3A;line-height:1.6;white-space:pre-wrap">${msg.message}</p>
          </div>
          <div style="margin-top:24px">
            <a href="${SITE}/admin/communications"
               style="display:inline-block;background:#2C5F2E;color:#F5F1E6;text-decoration:none;
                      padding:12px 24px;border-radius:3px;font-size:13px;font-weight:600">
              View in admin →
            </a>
          </div>
        </div>
      </div>
    `,
  })
}

function emailFooter(unsubscribeUrl: string): string {
  return `
  <div style="border-top:1px solid #E8E0D4;padding-top:16px;margin-top:32px;">
    <p style="font-size:12px;color:#A89F94;line-height:1.6;margin:0;">
      Acme Vintage Supply · Dartmouth, Nova Scotia<br>
      You're receiving this because you subscribed at acmevintagesupply.com.<br>
      <a href="${unsubscribeUrl}" style="color:#A89F94;">Unsubscribe</a>
    </p>
  </div>`
}

function emailWrapper(content: string): string {
  return `<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;background:#FDFAF6;border:1px solid #E8E0D4;border-radius:8px;padding:40px 40px 32px;">${content}</div>`
}

function bodyParagraphs(text: string): string {
  return text.split('\n').filter(l => l.trim())
    .map(l => `<p style="font-size:15px;line-height:1.7;color:#6B6257;margin:0 0 16px;">${l}</p>`)
    .join('')
}

function ctaButton(label: string, url: string): string {
  return `<a href="${url}" style="display:inline-block;background:#2C5F2E;color:#F5F1E6;text-decoration:none;padding:12px 28px;border-radius:3px;font-family:sans-serif;font-size:14px;font-weight:600;margin-bottom:32px;">${label}</a>`
}

function buildBenchNotesHtml(c: NewsletterCampaign, unsubscribeUrl: string): string {
  const greeting = c.templateData?.greeting ?? 'A note from the bench.'
  const cta = c.ctaLabel && c.ctaUrl ? ctaButton(c.ctaLabel, c.ctaUrl) : ''
  return emailWrapper(`
    <p style="font-size:13px;color:#A89F94;font-family:sans-serif;letter-spacing:1px;text-transform:uppercase;margin:0 0 20px;">${greeting}</p>
    ${bodyParagraphs(c.body)}
    ${cta}
    ${emailFooter(unsubscribeUrl)}
  `)
}

function buildNewArrivalsHtml(c: NewsletterCampaign, unsubscribeUrl: string): string {
  const products = c.templateData?.products ?? []
  const productCards = products.map(p => `
    <table style="width:100%;border-collapse:collapse;margin-bottom:16px;border:1px solid #E8E0D4;border-radius:6px;">
      <tr>
        <td style="width:88px;padding:12px;vertical-align:top;">
          ${p.imageUrl
            ? `<img src="${p.imageUrl}" width="64" height="64" style="object-fit:cover;border-radius:4px;display:block;" alt="${p.title}" />`
            : `<div style="width:64px;height:64px;background:#E8E0D4;border-radius:4px;"></div>`
          }
        </td>
        <td style="padding:12px;vertical-align:top;">
          <p style="font-size:14px;font-weight:600;color:#2C2C2A;margin:0 0 4px;">${p.title}</p>
          <p style="font-size:13px;color:#6B6257;margin:0 0 10px;">${p.price}</p>
          <a href="${SITE}/catalog/${p.handle}" style="font-size:12px;color:#2C5F2E;text-decoration:none;font-family:sans-serif;font-weight:600;">View product →</a>
        </td>
      </tr>
    </table>
  `).join('')
  const cta = c.ctaLabel && c.ctaUrl ? ctaButton(c.ctaLabel, c.ctaUrl) : ''
  return emailWrapper(`
    ${bodyParagraphs(c.body)}
    ${productCards}
    ${cta}
    ${emailFooter(unsubscribeUrl)}
  `)
}

function buildSeasonalSaleHtml(c: NewsletterCampaign, unsubscribeUrl: string): string {
  const { headline = '', discountCode = '', saleEndDate } = c.templateData ?? {}
  const codeBlock = discountCode ? `
    <div style="background:#F5F1E6;border:2px dashed #B8964E;border-radius:6px;padding:16px;text-align:center;margin:20px 0;">
      <p style="font-size:11px;color:#A89F94;font-family:sans-serif;text-transform:uppercase;letter-spacing:2px;margin:0 0 6px;">Use code</p>
      <p style="font-size:26px;font-weight:700;color:#B8964E;letter-spacing:4px;margin:0;">${discountCode}</p>
    </div>` : ''
  const urgency = saleEndDate
    ? `<p style="font-size:13px;color:#B8964E;text-align:center;margin:0 0 20px;font-family:sans-serif;">Offer ends ${new Date(saleEndDate).toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' })}</p>`
    : ''
  const cta = c.ctaLabel && c.ctaUrl ? ctaButton(c.ctaLabel, c.ctaUrl) : ''
  return emailWrapper(`
    ${headline ? `<h2 style="font-size:22px;font-weight:700;color:#2C2C2A;margin:0 0 20px;">${headline}</h2>` : ''}
    ${bodyParagraphs(c.body)}
    ${codeBlock}
    ${urgency}
    ${cta}
    ${emailFooter(unsubscribeUrl)}
  `)
}

function buildEmailHtml(c: NewsletterCampaign, unsubscribeUrl: string): string {
  switch (c.template ?? 'bench_notes') {
    case 'new_arrivals':  return buildNewArrivalsHtml(c, unsubscribeUrl)
    case 'seasonal_sale': return buildSeasonalSaleHtml(c, unsubscribeUrl)
    default:              return buildBenchNotesHtml(c, unsubscribeUrl)
  }
}

export async function sendNewsletter(
  subscribers: { email: string }[],
  campaign: NewsletterCampaign
): Promise<number> {
  if (!subscribers.length) return 0

  const BATCH = 50
  let sent = 0

  for (let i = 0; i < subscribers.length; i += BATCH) {
    const slice = subscribers.slice(i, i + BATCH)
    const messages = slice.map(sub => {
      const token = Buffer.from(sub.email).toString('base64url')
      return {
        from:    FROM,
        to:      sub.email,
        subject: campaign.subject,
        html: buildEmailHtml(campaign, `${SITE}/api/newsletter/unsubscribe?email=${token}`),
      }
    })
    try {
      const result = await resend.batch.send(messages)
      if (result.data) {
        sent += result.data.data.length
      }
    } catch {
      // batch failed — continue to next batch, total count will reflect actual sends
    }
    if (i + BATCH < subscribers.length) {
      await new Promise(r => setTimeout(r, 1000))
    }
  }
  return sent
}

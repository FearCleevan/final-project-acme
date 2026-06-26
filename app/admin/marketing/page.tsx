'use client'

import { useState, useEffect, useCallback } from 'react'
import PageHeader from '@/components/admin/shared/PageHeader'
import SectionCard from '@/components/admin/shared/SectionCard'
import Badge from '@/components/admin/shared/Badge'
import Toast, { ToastType } from '@/components/admin/shared/Toast'
import { cn } from '@/lib/utils'
import type { TemplateType, NewsletterProduct } from '@/lib/email'
import {
  BiGroup, BiEnvelopeOpen, BiDownload, BiPlus, BiSend,
  BiLoader, BiX, BiCalendar, BiImage, BiSearch,
} from 'react-icons/bi'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Subscriber {
  email:            string
  subscribed_at:    string
  unsubscribed_at:  string | null
}

interface SearchProduct {
  id:     string
  slug:   string
  name:   string
  price:  string
  images: string[]
}

interface Campaign {
  id:               string
  subject:          string
  status:           'draft' | 'sent'
  scheduled_for:    string | null
  sent_at:          string | null
  recipient_count:  number | null
  created_at:       string
  template:         TemplateType
  template_data:    Record<string, unknown> | null
}

type Tab = 'subscribers' | 'campaigns'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-CA', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function MarketingPage() {
  const [tab, setTab] = useState<Tab>('subscribers')

  // Subscribers state
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [subsLoading,  setSubsLoading]  = useState(true)

  // Campaigns state
  const [campaigns,     setCampaigns]     = useState<Campaign[]>([])
  const [campsLoading,  setCampsLoading]  = useState(true)

  // Compose form state
  const [composing,    setComposing]    = useState(false)
  const [subject,      setSubject]      = useState('')
  const [body,         setBody]         = useState('')
  const [ctaLabel,     setCtaLabel]     = useState('')
  const [ctaUrl,       setCtaUrl]       = useState('')
  const [scheduleFor,  setScheduleFor]  = useState('')
  const [previewing,   setPreviewing]   = useState(false)
  const [saving,       setSaving]       = useState(false)
  const [sending,      setSending]      = useState<string | null>(null)  // campaign id being sent

  // Template state
  const [template,          setTemplate]          = useState<TemplateType>('bench_notes')
  const [greeting,          setGreeting]          = useState('A note from the bench.')
  const [saleHeadline,      setSaleHeadline]      = useState('')
  const [discountCode,      setDiscountCode]      = useState('')
  const [saleEndDate,       setSaleEndDate]       = useState('')
  const [selectedProducts,  setSelectedProducts]  = useState<NewsletterProduct[]>([])
  const [productSearch,     setProductSearch]     = useState('')
  const [productResults,    setProductResults]    = useState<SearchProduct[]>([])
  const [searchLoading,     setSearchLoading]     = useState(false)
  const [allProducts,       setAllProducts]       = useState<SearchProduct[]>([])

  // Toast
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)
  function showToast(message: string, type: ToastType = 'success') {
    setToast({ message, type })
  }

  // ── Data fetching ──────────────────────────────────────────────────────────

  const loadSubscribers = useCallback(async () => {
    setSubsLoading(true)
    try {
      const r = await fetch('/api/admin/marketing/subscribers')
      if (r.ok) setSubscribers(await r.json())
    } finally {
      setSubsLoading(false)
    }
  }, [])

  const loadCampaigns = useCallback(async () => {
    setCampsLoading(true)
    try {
      const r = await fetch('/api/admin/marketing/campaigns')
      if (r.ok) setCampaigns(await r.json())
    } finally {
      setCampsLoading(false)
    }
  }, [])

  useEffect(() => { loadSubscribers() }, [loadSubscribers])
  useEffect(() => { loadCampaigns() }, [loadCampaigns])

  // Fetch all products once when New Arrivals template is first used
  useEffect(() => {
    if (template !== 'new_arrivals' || allProducts.length > 0) return
    fetch('/api/search')
      .then(r => r.ok ? r.json() : [])
      .then(setAllProducts)
      .catch(() => {})
  }, [template, allProducts.length])

  // Filter products client-side on search input
  useEffect(() => {
    if (!productSearch.trim() || selectedProducts.length >= 3) {
      setProductResults([])
      setSearchLoading(false)
      return
    }
    setSearchLoading(true)
    const timer = setTimeout(() => {
      const q = productSearch.toLowerCase()
      const selectedHandles = new Set(selectedProducts.map(p => p.handle))
      setProductResults(
        allProducts
          .filter(p => p.name.toLowerCase().includes(q) && !selectedHandles.has(p.slug))
          .slice(0, 5)
      )
      setSearchLoading(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [productSearch, selectedProducts, allProducts])

  // ── Actions ────────────────────────────────────────────────────────────────

  function handleExportCsv() {
    window.location.href = '/api/admin/marketing/subscribers?format=csv'
  }

  function resetCompose() {
    setSubject(''); setBody(''); setCtaLabel(''); setCtaUrl('')
    setScheduleFor(''); setPreviewing(false); setComposing(false)
    setTemplate('bench_notes'); setGreeting('A note from the bench.')
    setSaleHeadline(''); setDiscountCode(''); setSaleEndDate('')
    setSelectedProducts([]); setProductSearch(''); setProductResults([])
  }

  function handleTemplateChange(t: TemplateType) {
    setTemplate(t)
    setGreeting('A note from the bench.')
    setSaleHeadline(''); setDiscountCode(''); setSaleEndDate('')
    setSelectedProducts([]); setProductSearch(''); setProductResults([])
    setBody('')
  }

  function getBodyForTemplate(): string {
    // New Arrivals uses body field as intro line; others use body as letter/sale body
    return body
  }

  function buildTemplateData(): Record<string, unknown> | null {
    if (template === 'bench_notes') return { greeting }
    if (template === 'new_arrivals') return {
      products: selectedProducts.map(p => ({
        title: p.title, price: p.price, imageUrl: p.imageUrl, handle: p.handle,
      }))
    }
    if (template === 'seasonal_sale') return {
      headline:     saleHeadline     || undefined,
      discountCode: discountCode     || undefined,
      saleEndDate:  saleEndDate      || undefined,
    }
    return null
  }

  function addProduct(p: SearchProduct) {
    if (selectedProducts.length >= 3) return
    setSelectedProducts(prev => [...prev, {
      title:    p.name,
      price:    p.price,
      imageUrl: p.images[0] ?? '',
      handle:   p.slug,
    }])
    setProductSearch('')
    setProductResults([])
  }

  function removeProduct(handle: string) {
    setSelectedProducts(prev => prev.filter(p => p.handle !== handle))
  }

  async function handleSaveDraft() {
    if (!subject.trim() || !body.trim()) {
      showToast('Subject and body are required.', 'error'); return
    }
    if (template === 'new_arrivals' && selectedProducts.length === 0) {
      showToast('Add at least one product for New Arrivals.', 'error'); return
    }
    if (template === 'seasonal_sale' && (!ctaLabel.trim() || !ctaUrl.trim())) {
      showToast('Seasonal Sale requires a CTA button label and URL.', 'error'); return
    }
    setSaving(true)
    try {
      const r = await fetch('/api/admin/marketing/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject, body: getBodyForTemplate(),
          cta_label:     ctaLabel || null,
          cta_url:       ctaUrl   || null,
          scheduled_for: scheduleFor || null,
          template,
          template_data: buildTemplateData(),
        }),
      })
      if (!r.ok) throw new Error()
      showToast('Draft saved.')
      resetCompose()
      await loadCampaigns()
    } catch {
      showToast('Failed to save draft.', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleSendNow() {
    if (!subject.trim() || !body.trim()) {
      showToast('Subject and body are required.', 'error'); return
    }
    if (template === 'new_arrivals' && selectedProducts.length === 0) {
      showToast('Add at least one product for New Arrivals.', 'error'); return
    }
    if (template === 'seasonal_sale' && (!ctaLabel.trim() || !ctaUrl.trim())) {
      showToast('Seasonal Sale requires a CTA button label and URL.', 'error'); return
    }
    setSaving(true)
    try {
      // Save draft first to get an id
      const saveRes = await fetch('/api/admin/marketing/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject, body: getBodyForTemplate(),
          cta_label: ctaLabel || null,
          cta_url:   ctaUrl   || null,
          template,
          template_data: buildTemplateData(),
        }),
      })
      if (!saveRes.ok) throw new Error('Failed to create campaign')
      const { id } = await saveRes.json()

      const sendRes = await fetch(`/api/admin/marketing/campaigns/${id}/send`, {
        method: 'POST',
      })
      if (!sendRes.ok) throw new Error('Failed to send')
      const { sent } = await sendRes.json()
      showToast(`Sent to ${sent} subscriber${sent === 1 ? '' : 's'}.`)
      resetCompose()
      await loadCampaigns()
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Send failed.', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleSendExisting(campaignId: string) {
    setSending(campaignId)
    try {
      const r = await fetch(`/api/admin/marketing/campaigns/${campaignId}/send`, {
        method: 'POST',
      })
      const json = await r.json()
      if (!r.ok) throw new Error(json.error ?? 'Send failed')
      showToast(`Sent to ${json.sent} subscriber${json.sent === 1 ? '' : 's'}.`)
      await loadCampaigns()
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Send failed.', 'error')
    } finally {
      setSending(null)
    }
  }

  // ── Preview HTML ───────────────────────────────────────────────────────────

  function buildPreviewHtml(): string {
    const sub = subject || '(No subject)'
    const bodyText = body.split('\n').filter(l => l.trim())
      .map(l => `<p style="font-size:15px;line-height:1.7;color:#6B6257;margin:0 0 16px;">${l}</p>`)
      .join('')
    const cta = ctaLabel && ctaUrl
      ? `<a href="${ctaUrl}" style="display:inline-block;background:#2C5F2E;color:#F5F1E6;text-decoration:none;padding:12px 28px;border-radius:3px;font-family:sans-serif;font-size:14px;font-weight:600;margin-bottom:32px;">${ctaLabel}</a>`
      : ''
    const footer = `<div style="border-top:1px solid #E8E0D4;padding-top:16px;margin-top:32px;"><p style="font-size:12px;color:#A89F94;line-height:1.6;margin:0;">Acme Vintage Supply · Dartmouth, Nova Scotia<br>You're receiving this because you subscribed at acmevintagesupply.com.<br><a href="#" style="color:#A89F94;">Unsubscribe</a></p></div>`
    const wrap = (inner: string) => `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;background:#F5F1E6;padding:40px 16px;"><div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;background:#FDFAF6;border:1px solid #E8E0D4;border-radius:8px;padding:40px 40px 32px;">${inner}</div></body></html>`

    if (template === 'new_arrivals') {
      const intro = bodyText
      const cards = selectedProducts.map(p => `
        <table style="width:100%;border-collapse:collapse;margin-bottom:16px;border:1px solid #E8E0D4;border-radius:6px;">
          <tr>
            <td style="width:88px;padding:12px;vertical-align:top;">
              ${p.imageUrl ? `<img src="${p.imageUrl}" width="64" height="64" style="object-fit:cover;border-radius:4px;display:block;" alt="${p.title}" />` : `<div style="width:64px;height:64px;background:#E8E0D4;border-radius:4px;"></div>`}
            </td>
            <td style="padding:12px;vertical-align:top;">
              <p style="font-size:14px;font-weight:600;color:#2C2C2A;margin:0 0 4px;">${p.title}</p>
              <p style="font-size:13px;color:#6B6257;margin:0 0 10px;">${p.price}</p>
              <span style="font-size:12px;color:#2C5F2E;font-family:sans-serif;font-weight:600;">View product →</span>
            </td>
          </tr>
        </table>`).join('')
      return wrap(`<h2 style="font-size:22px;font-weight:600;margin:0 0 20px;color:#2C2C2A;">${sub}</h2>${intro}${cards}${cta}${footer}`)
    }

    if (template === 'seasonal_sale') {
      const headline = saleHeadline ? `<h2 style="font-size:22px;font-weight:700;color:#2C2C2A;margin:0 0 20px;">${saleHeadline}</h2>` : ''
      const code = discountCode ? `<div style="background:#F5F1E6;border:2px dashed #B8964E;border-radius:6px;padding:16px;text-align:center;margin:20px 0;"><p style="font-size:11px;color:#A89F94;font-family:sans-serif;text-transform:uppercase;letter-spacing:2px;margin:0 0 6px;">Use code</p><p style="font-size:26px;font-weight:700;color:#B8964E;letter-spacing:4px;margin:0;">${discountCode}</p></div>` : ''
      const urgency = saleEndDate ? `<p style="font-size:13px;color:#B8964E;text-align:center;margin:0 0 20px;font-family:sans-serif;">Offer ends ${new Date(saleEndDate).toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' })}</p>` : ''
      return wrap(`${headline}${bodyText}${code}${urgency}${cta}${footer}`)
    }

    // bench_notes (default)
    const greetingLine = `<p style="font-size:13px;color:#A89F94;font-family:sans-serif;letter-spacing:1px;text-transform:uppercase;margin:0 0 20px;">${greeting}</p>`
    return wrap(`<h2 style="font-size:22px;font-weight:600;margin:0 0 20px;color:#2C2C2A;">${sub}</h2>${greetingLine}${bodyText}${cta}${footer}`)
  }

  const activeCount = subscribers.filter(s => !s.unsubscribed_at).length

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div>
      <PageHeader title="Marketing" subtitle="Newsletter subscribers and email campaigns" />

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-(--admin-border)">
        {([
          { id: 'subscribers', label: 'Subscribers', icon: BiGroup },
          { id: 'campaigns',   label: 'Campaigns',   icon: BiEnvelopeOpen },
        ] as const).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium border-b-2 -mb-px transition-colors',
              tab === t.id
                ? 'border-(--admin-accent) text-(--admin-accent)'
                : 'border-transparent text-(--admin-text-soft) hover:text-(--admin-text)'
            )}
          >
            <t.icon size={15} />
            {t.label}
            {t.id === 'subscribers' && activeCount > 0 && (
              <Badge variant="neutral" label={String(activeCount)} />
            )}
          </button>
        ))}
      </div>

      {/* ── Subscribers Tab ── */}
      {tab === 'subscribers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[14px] text-(--admin-text-soft)">
              <span className="font-semibold text-(--admin-text)">{activeCount}</span> active subscriber{activeCount === 1 ? '' : 's'}
            </p>
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-(--admin-border) text-[12px] text-(--admin-text-soft) hover:text-(--admin-text) hover:bg-(--admin-surface-2) transition-colors"
            >
              <BiDownload size={14} />
              Export CSV
            </button>
          </div>

          <SectionCard noPadding>
            {subsLoading ? (
              <div className="flex items-center justify-center py-12 text-(--admin-text-muted)">
                <BiLoader size={20} className="animate-spin mr-2" /> Loading…
              </div>
            ) : subscribers.length === 0 ? (
              <p className="text-center py-12 text-[14px] text-(--admin-text-muted)">No subscribers yet.</p>
            ) : (
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-(--admin-border)">
                    <th className="text-left px-4 py-3 font-medium text-(--admin-text-muted)">Email</th>
                    <th className="text-left px-4 py-3 font-medium text-(--admin-text-muted)">Subscribed</th>
                    <th className="text-left px-4 py-3 font-medium text-(--admin-text-muted)">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-(--admin-border)">
                  {subscribers.map(s => (
                    <tr key={s.email} className="hover:bg-(--admin-surface-2) transition-colors">
                      <td className="px-4 py-3 text-(--admin-text)">{s.email}</td>
                      <td className="px-4 py-3 text-(--admin-text-soft)">{fmtDate(s.subscribed_at)}</td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={s.unsubscribed_at ? 'amber' : 'green'}
                          label={s.unsubscribed_at ? 'Unsubscribed' : 'Active'}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </SectionCard>
        </div>
      )}

      {/* ── Campaigns Tab ── */}
      {tab === 'campaigns' && (
        <div className="space-y-4">
          {!composing && (
            <div className="flex justify-end">
              <button
                onClick={() => setComposing(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-(--admin-accent) text-(--admin-accent-text) text-[13px] font-medium hover:opacity-90 transition-opacity"
              >
                <BiPlus size={16} />
                New Campaign
              </button>
            </div>
          )}

          {/* Compose panel */}
          {composing && (
            <SectionCard>
              <div className="flex items-center justify-between mb-5">
                <p className="text-[14px] font-semibold text-(--admin-text)">New Campaign</p>
                <button
                  onClick={resetCompose}
                  className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-(--admin-surface-2) text-(--admin-text-muted) transition-colors"
                >
                  <BiX size={16} />
                </button>
              </div>

              {/* Template selector */}
              <div className="mb-5">
                <label className="block text-[12px] font-medium text-(--admin-text-soft) mb-2">Template</label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { id: 'bench_notes',   label: 'Bench Notes',   desc: 'Personal letter' },
                    { id: 'new_arrivals',  label: 'New Arrivals',  desc: 'Product showcase' },
                    { id: 'seasonal_sale', label: 'Seasonal Sale', desc: 'Promo + code' },
                  ] as { id: TemplateType; label: string; desc: string }[]).map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleTemplateChange(t.id)}
                      className={cn(
                        'text-left px-3 py-2.5 rounded-md border text-[12px] transition-colors',
                        template === t.id
                          ? 'border-(--admin-accent) bg-(--admin-accent)/10 text-(--admin-accent)'
                          : 'border-(--admin-border) text-(--admin-text-soft) hover:text-(--admin-text) hover:bg-(--admin-surface-2)'
                      )}
                    >
                      <p className="font-semibold">{t.label}</p>
                      <p className="text-[11px] opacity-70 mt-0.5">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[12px] font-medium text-(--admin-text-soft) mb-1">Subject *</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    placeholder="Your monthly bench notes are here"
                    className="w-full px-3 py-2 rounded-md border border-(--admin-border) bg-(--admin-surface) text-[13px] text-(--admin-text) placeholder:text-(--admin-text-muted) focus:outline-none focus:border-(--admin-accent) transition-colors"
                  />
                </div>

                {/* Bench Notes: greeting line */}
                {template === 'bench_notes' && (
                  <div>
                    <label className="block text-[12px] font-medium text-(--admin-text-soft) mb-1">Greeting line</label>
                    <input
                      type="text"
                      value={greeting}
                      onChange={e => setGreeting(e.target.value)}
                      className="w-full px-3 py-2 rounded-md border border-(--admin-border) bg-(--admin-surface) text-[13px] text-(--admin-text) placeholder:text-(--admin-text-muted) focus:outline-none focus:border-(--admin-accent) transition-colors"
                    />
                  </div>
                )}

                {/* Seasonal Sale: headline */}
                {template === 'seasonal_sale' && (
                  <div>
                    <label className="block text-[12px] font-medium text-(--admin-text-soft) mb-1">Headline *</label>
                    <input
                      type="text"
                      value={saleHeadline}
                      onChange={e => setSaleHeadline(e.target.value)}
                      placeholder="Summer clearance — 20% off selected lamps"
                      className="w-full px-3 py-2 rounded-md border border-(--admin-border) bg-(--admin-surface) text-[13px] text-(--admin-text) placeholder:text-(--admin-text-muted) focus:outline-none focus:border-(--admin-accent) transition-colors"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[12px] font-medium text-(--admin-text-soft) mb-1">
                    {template === 'new_arrivals' ? 'Intro line *' : 'Body *'}
                    {template !== 'new_arrivals' && <span className="font-normal"> (each line becomes a paragraph)</span>}
                  </label>
                  <textarea
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    rows={8}
                    placeholder={template === 'new_arrivals'
                      ? 'Fresh pieces just landed at the workshop.'
                      : template === 'seasonal_sale'
                        ? 'Describe the sale items and why they\'re worth grabbing...'
                        : 'This month from the workshop...\n\nWe\'ve had some interesting pieces come through the bench.'}
                    className="w-full px-3 py-2 rounded-md border border-(--admin-border) bg-(--admin-surface) text-[13px] text-(--admin-text) placeholder:text-(--admin-text-muted) focus:outline-none focus:border-(--admin-accent) transition-colors resize-y"
                  />
                </div>

                {/* New Arrivals: product picker */}
                {template === 'new_arrivals' && (
                  <div>
                    <label className="block text-[12px] font-medium text-(--admin-text-soft) mb-1">
                      Products <span className="font-normal">({selectedProducts.length}/3 selected)</span>
                    </label>

                    {/* Selected products */}
                    {selectedProducts.length > 0 && (
                      <div className="space-y-2 mb-3">
                        {selectedProducts.map(p => (
                          <div key={p.handle} className="flex items-center gap-3 px-3 py-2 rounded-md border border-(--admin-border) bg-(--admin-surface-2)">
                            {p.imageUrl
                              ? <img src={p.imageUrl} alt={p.title} className="w-8 h-8 rounded object-cover shrink-0" />
                              : <div className="w-8 h-8 rounded bg-(--admin-border) shrink-0 flex items-center justify-center"><BiImage size={14} className="text-(--admin-text-muted)" /></div>
                            }
                            <div className="flex-1 min-w-0">
                              <p className="text-[12px] font-medium text-(--admin-text) truncate">{p.title}</p>
                              <p className="text-[11px] text-(--admin-text-muted)">{p.price}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeProduct(p.handle)}
                              className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-(--admin-border) text-(--admin-text-muted) transition-colors shrink-0"
                            >
                              <BiX size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Search input — hide when 3 selected */}
                    {selectedProducts.length < 3 && (
                      <div className="relative">
                        <div className="relative">
                          <BiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-(--admin-text-muted)" />
                          <input
                            type="text"
                            value={productSearch}
                            onChange={e => setProductSearch(e.target.value)}
                            placeholder="Search products…"
                            className="w-full pl-8 pr-3 py-2 rounded-md border border-(--admin-border) bg-(--admin-surface) text-[13px] text-(--admin-text) placeholder:text-(--admin-text-muted) focus:outline-none focus:border-(--admin-accent) transition-colors"
                          />
                          {searchLoading && <BiLoader size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-(--admin-text-muted) animate-spin" />}
                        </div>

                        {/* Dropdown results */}
                        {productResults.length > 0 && (
                          <div className="absolute z-10 top-full left-0 right-0 mt-1 rounded-md border border-(--admin-border) bg-(--admin-surface) shadow-lg divide-y divide-(--admin-border)">
                            {productResults.map(p => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => addProduct(p)}
                                className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-(--admin-surface-2) transition-colors"
                              >
                                {p.images[0]
                                  ? <img src={p.images[0]} alt={p.name} className="w-8 h-8 rounded object-cover shrink-0" />
                                  : <div className="w-8 h-8 rounded bg-(--admin-border) shrink-0" />
                                }
                                <div className="flex-1 min-w-0">
                                  <p className="text-[12px] font-medium text-(--admin-text) truncate">{p.name}</p>
                                  <p className="text-[11px] text-(--admin-text-muted)">{p.price}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Seasonal Sale: discount code + end date */}
                {template === 'seasonal_sale' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[12px] font-medium text-(--admin-text-soft) mb-1">Discount Code <span className="font-normal">(optional)</span></label>
                      <input
                        type="text"
                        value={discountCode}
                        onChange={e => setDiscountCode(e.target.value.toUpperCase())}
                        placeholder="SUMMER20"
                        className="w-full px-3 py-2 rounded-md border border-(--admin-border) bg-(--admin-surface) text-[13px] text-(--admin-text) font-mono placeholder:text-(--admin-text-muted) focus:outline-none focus:border-(--admin-accent) transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-(--admin-text-soft) mb-1">Sale End Date <span className="font-normal">(optional)</span></label>
                      <input
                        type="date"
                        value={saleEndDate}
                        onChange={e => setSaleEndDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-md border border-(--admin-border) bg-(--admin-surface) text-[13px] text-(--admin-text) focus:outline-none focus:border-(--admin-accent) transition-colors"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-medium text-(--admin-text-soft) mb-1">CTA Button Label <span className="font-normal">(optional)</span></label>
                    <input
                      type="text"
                      value={ctaLabel}
                      onChange={e => setCtaLabel(e.target.value)}
                      placeholder="Shop new arrivals →"
                      className="w-full px-3 py-2 rounded-md border border-(--admin-border) bg-(--admin-surface) text-[13px] text-(--admin-text) placeholder:text-(--admin-text-muted) focus:outline-none focus:border-(--admin-accent) transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-(--admin-text-soft) mb-1">CTA URL <span className="font-normal">(optional)</span></label>
                    <input
                      type="url"
                      value={ctaUrl}
                      onChange={e => setCtaUrl(e.target.value)}
                      placeholder="https://acmevintagesupply.com/catalog"
                      className="w-full px-3 py-2 rounded-md border border-(--admin-border) bg-(--admin-surface) text-[13px] text-(--admin-text) placeholder:text-(--admin-text-muted) focus:outline-none focus:border-(--admin-accent) transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-(--admin-text-soft) mb-1">
                    <BiCalendar size={12} className="inline mr-1" />
                    Schedule for <span className="font-normal">(optional — leave blank to send manually)</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduleFor}
                    onChange={e => setScheduleFor(e.target.value)}
                    className="px-3 py-2 rounded-md border border-(--admin-border) bg-(--admin-surface) text-[13px] text-(--admin-text) focus:outline-none focus:border-(--admin-accent) transition-colors"
                  />
                </div>

                {/* Preview toggle */}
                <div>
                  <button
                    onClick={() => setPreviewing(p => !p)}
                    className="text-[12px] text-(--admin-accent) hover:underline"
                  >
                    {previewing ? 'Hide preview' : 'Show preview'}
                  </button>
                </div>

                {previewing && (
                  <div className="rounded-lg border border-(--admin-border) overflow-hidden">
                    <p className="px-3 py-2 text-[11px] font-mono text-(--admin-text-muted) bg-(--admin-surface-2) border-b border-(--admin-border)">
                      Email preview
                    </p>
                    <iframe
                      srcDoc={buildPreviewHtml()}
                      sandbox="allow-same-origin"
                      className="w-full h-125 bg-white"
                      title="Email preview"
                    />
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={handleSendNow}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 rounded-md bg-(--admin-accent) text-(--admin-accent-text) text-[13px] font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                  >
                    {saving ? <BiLoader size={14} className="animate-spin" /> : <BiSend size={14} />}
                    Send Now
                  </button>
                  <button
                    onClick={handleSaveDraft}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 rounded-md border border-(--admin-border) text-[13px] text-(--admin-text-soft) hover:text-(--admin-text) hover:bg-(--admin-surface-2) disabled:opacity-50 transition-colors"
                  >
                    Save Draft
                  </button>
                </div>
              </div>
            </SectionCard>
          )}

          {/* Campaign list */}
          <SectionCard noPadding>
            {campsLoading ? (
              <div className="flex items-center justify-center py-12 text-(--admin-text-muted)">
                <BiLoader size={20} className="animate-spin mr-2" /> Loading…
              </div>
            ) : campaigns.length === 0 ? (
              <p className="text-center py-12 text-[14px] text-(--admin-text-muted)">No campaigns yet. Create one above.</p>
            ) : (
              <div className="divide-y divide-(--admin-border)">
                {campaigns.map(c => (
                  <div key={c.id} className="flex items-center justify-between px-4 py-3 gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-(--admin-text) truncate">{c.subject}</p>
                      <p className="text-[12px] text-(--admin-text-muted) mt-0.5">
                        {c.status === 'sent'
                          ? `Sent ${c.sent_at ? fmtDate(c.sent_at) : '—'} · ${c.recipient_count ?? 0} recipient${c.recipient_count === 1 ? '' : 's'}`
                          : c.scheduled_for
                            ? `Scheduled for ${fmtDate(c.scheduled_for)}`
                            : `Draft · ${fmtDate(c.created_at)}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant={c.status === 'sent' ? 'green' : 'amber'}
                        label={c.status === 'sent' ? 'Sent' : 'Draft'}
                      />
                      {c.status === 'draft' && (
                        <button
                          onClick={() => handleSendExisting(c.id)}
                          disabled={sending === c.id}
                          className="flex items-center gap-1.5 px-3 py-1 rounded-md border border-(--admin-border) text-[12px] text-(--admin-text-soft) hover:text-(--admin-text) hover:bg-(--admin-surface-2) disabled:opacity-50 transition-colors"
                        >
                          {sending === c.id
                            ? <BiLoader size={12} className="animate-spin" />
                            : <BiSend size={12} />}
                          Send
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}

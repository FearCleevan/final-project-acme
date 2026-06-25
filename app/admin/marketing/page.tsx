'use client'

import { useState, useEffect, useCallback } from 'react'
import PageHeader from '@/components/admin/shared/PageHeader'
import SectionCard from '@/components/admin/shared/SectionCard'
import Badge from '@/components/admin/shared/Badge'
import Toast, { ToastType } from '@/components/admin/shared/Toast'
import { cn } from '@/lib/utils'
import {
  BiGroup, BiEnvelopeOpen, BiDownload, BiPlus, BiSend,
  BiLoader, BiX, BiCalendar,
} from 'react-icons/bi'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Subscriber {
  email:            string
  subscribed_at:    string
  unsubscribed_at:  string | null
}

interface Campaign {
  id:               string
  subject:          string
  status:           'draft' | 'sent'
  scheduled_for:    string | null
  sent_at:          string | null
  recipient_count:  number | null
  created_at:       string
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

  // ── Actions ────────────────────────────────────────────────────────────────

  function handleExportCsv() {
    window.location.href = '/api/admin/marketing/subscribers?format=csv'
  }

  function resetCompose() {
    setSubject(''); setBody(''); setCtaLabel(''); setCtaUrl('')
    setScheduleFor(''); setPreviewing(false); setComposing(false)
  }

  async function handleSaveDraft() {
    if (!subject.trim() || !body.trim()) {
      showToast('Subject and body are required.', 'error'); return
    }
    setSaving(true)
    try {
      const r = await fetch('/api/admin/marketing/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject, body,
          cta_label:     ctaLabel || null,
          cta_url:       ctaUrl   || null,
          scheduled_for: scheduleFor || null,
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
    setSaving(true)
    try {
      // Save draft first to get an id
      const saveRes = await fetch('/api/admin/marketing/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject, body,
          cta_label: ctaLabel || null,
          cta_url:   ctaUrl   || null,
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

  function buildPreviewHtml() {
    const bodyHtml = body
      .split('\n')
      .filter(l => l.trim())
      .map(l => `<p style="font-size:15px;line-height:1.7;color:#6B6257;margin:0 0 16px;">${l}</p>`)
      .join('')
    const ctaHtml = ctaLabel && ctaUrl
      ? `<a href="${ctaUrl}" style="display:inline-block;background:#2C5F2E;color:#F5F1E6;text-decoration:none;padding:12px 28px;border-radius:3px;font-family:sans-serif;font-size:14px;font-weight:600;margin-bottom:32px;">${ctaLabel}</a>`
      : ''
    return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;background:#F5F1E6;padding:40px 16px;">
<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;background:#FDFAF6;border:1px solid #E8E0D4;border-radius:8px;padding:40px 40px 32px;">
<h2 style="font-size:22px;font-weight:600;margin:0 0 20px;color:#2C2C2A;">${subject || '(No subject)'}</h2>
${bodyHtml}${ctaHtml}
<div style="border-top:1px solid #E8E0D4;padding-top:16px;margin-top:32px;">
<p style="font-size:12px;color:#A89F94;line-height:1.6;margin:0;">
Acme Vintage Supply · Dartmouth, Nova Scotia<br>
You're receiving this because you subscribed at acmevintagesupply.com.<br>
<a href="#" style="color:#A89F94;">Unsubscribe</a></p></div></div>
</body></html>`
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

                <div>
                  <label className="block text-[12px] font-medium text-(--admin-text-soft) mb-1">Body * <span className="font-normal">(each line becomes a paragraph)</span></label>
                  <textarea
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    rows={8}
                    placeholder={"This month from the workshop...\n\nWe've had some interesting pieces come through the bench."}
                    className="w-full px-3 py-2 rounded-md border border-(--admin-border) bg-(--admin-surface) text-[13px] text-(--admin-text) placeholder:text-(--admin-text-muted) focus:outline-none focus:border-(--admin-accent) transition-colors resize-y"
                  />
                </div>

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

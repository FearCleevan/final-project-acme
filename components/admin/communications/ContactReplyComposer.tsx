'use client'

import { useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import {
  BiBold, BiItalic, BiUnderline, BiListUl, BiListOl, BiImageAdd, BiLink,
} from 'react-icons/bi'

interface Props {
  message: { id: string; name: string; email: string }
  onSent:  (replyBody: string) => void
  onCancel: () => void
  showToast: (message: string, type: 'success' | 'error') => void
}

function buildGreeting(name: string): string {
  const firstName = name.trim().split(/\s+/)[0] || name
  return `<p>Hi ${firstName},</p><p></p><p></p><p>Best regards,<br>Acme Vintage Supply</p>`
}

export default function ContactReplyComposer({ message, onSent, onCancel, showToast }: Props) {
  const [sending, setSending] = useState(false)
  const [pickerOpen,    setPickerOpen]    = useState(false)
  const [pickerQuery,   setPickerQuery]   = useState('')
  const [pickerResults, setPickerResults] = useState<{ handle: string; title: string }[]>([])

  async function searchProducts(q: string) {
    setPickerQuery(q)
    if (!q.trim()) { setPickerResults([]); return }
    const res  = await fetch(`/api/admin/search?q=${encodeURIComponent(q)}`)
    const data = await res.json()
    setPickerResults(res.ok ? (data.products ?? []) : [])
  }

  function insertProductLink(product: { handle: string; title: string }) {
    if (!editor) return
    const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://acmevintagesupply.com'
    editor.chain().focus().insertContent(
      `<a href="${site}/catalog/${product.handle}">${product.title}</a>`
    ).run()
    setPickerOpen(false)
    setPickerQuery('')
    setPickerResults([])
  }

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      Image,
      Link.configure({ openOnClick: false }),
    ],
    content: buildGreeting(message.name),
  })

  async function handleSend() {
    if (!editor) return
    const html = editor.getHTML()
    setSending(true)
    try {
      const res  = await fetch(`/api/admin/communications/contacts/${message.id}/reply`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ body: html }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to send reply')
      showToast('Reply sent.', 'success')
      onSent(data.reply_body as string)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to send reply', 'error')
    } finally {
      setSending(false)
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !editor) return

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res  = await fetch('/api/admin/communications/contacts/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to upload image')
      editor.chain().focus().setImage({ src: data.url }).run()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to upload image', 'error')
    }
  }

  if (!editor) return null

  return (
    <div className="border border-(--admin-border) rounded-md overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-2 py-1.5 bg-(--admin-surface-2) border-b border-(--admin-border)">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${editor.isActive('bold') ? 'bg-(--admin-accent) text-(--admin-accent-text)' : 'text-(--admin-text-soft) hover:bg-(--admin-border)'}`}
          title="Bold"
        >
          <BiBold size={15} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${editor.isActive('italic') ? 'bg-(--admin-accent) text-(--admin-accent-text)' : 'text-(--admin-text-soft) hover:bg-(--admin-border)'}`}
          title="Italic"
        >
          <BiItalic size={15} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${editor.isActive('underline') ? 'bg-(--admin-accent) text-(--admin-accent-text)' : 'text-(--admin-text-soft) hover:bg-(--admin-border)'}`}
          title="Underline"
        >
          <BiUnderline size={15} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${editor.isActive('bulletList') ? 'bg-(--admin-accent) text-(--admin-accent-text)' : 'text-(--admin-text-soft) hover:bg-(--admin-border)'}`}
          title="Bullet list"
        >
          <BiListUl size={15} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${editor.isActive('orderedList') ? 'bg-(--admin-accent) text-(--admin-accent-text)' : 'text-(--admin-text-soft) hover:bg-(--admin-border)'}`}
          title="Numbered list"
        >
          <BiListOl size={15} />
        </button>
        <label
          className="w-7 h-7 flex items-center justify-center rounded transition-colors text-(--admin-text-soft) hover:bg-(--admin-border) cursor-pointer"
          title="Insert image"
        >
          <BiImageAdd size={15} />
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleImageUpload} className="hidden" />
        </label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setPickerOpen(o => !o)}
            className="w-7 h-7 flex items-center justify-center rounded transition-colors text-(--admin-text-soft) hover:bg-(--admin-border)"
            title="Insert product link"
          >
            <BiLink size={15} />
          </button>
          {pickerOpen && (
            <div className="absolute left-0 top-full mt-1 w-64 bg-(--admin-surface) border border-(--admin-border) rounded-md shadow-xl z-50 p-2">
              <input
                autoFocus
                type="text"
                value={pickerQuery}
                onChange={e => searchProducts(e.target.value)}
                placeholder="Search products…"
                className="w-full h-8 px-2 text-[12px] bg-(--admin-surface-2) border border-(--admin-border) rounded-md text-(--admin-text) placeholder:text-(--admin-text-muted) focus:outline-none"
              />
              <div className="mt-2 max-h-48 overflow-y-auto">
                {pickerQuery.trim() && pickerResults.length === 0 && (
                  <p className="text-[11px] text-(--admin-text-muted) px-1 py-2">No products found.</p>
                )}
                {pickerResults.map(p => (
                  <button
                    key={p.handle}
                    type="button"
                    onClick={() => insertProductLink(p)}
                    className="w-full text-left px-2 py-1.5 text-[12px] text-(--admin-text) hover:bg-(--admin-surface-2) rounded transition-colors truncate"
                  >
                    {p.title}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="px-3 py-2 min-h-32 max-h-72 overflow-y-auto text-[13px] text-(--admin-text)">
        <EditorContent editor={editor} />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 px-3 py-2 border-t border-(--admin-border) bg-(--admin-surface-2)">
        <button
          type="button"
          onClick={handleSend}
          disabled={sending}
          className="flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium bg-(--admin-accent) text-(--admin-accent-text) rounded hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {sending ? 'Sending…' : 'Send Reply'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={sending}
          className="flex items-center gap-1.5 h-8 px-3 text-[12px] text-(--admin-text-muted) bg-(--admin-surface) border border-(--admin-border) rounded hover:bg-(--admin-border) transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

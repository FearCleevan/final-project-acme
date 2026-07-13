// Plain (non-httpOnly) cookie identifying an anonymous browser across visits,
// so guest cart activity can be tracked and later reattached to a real
// customer account on login. Readable client-side (this file) and
// server-side (via Next's cookies()) since it's a normal cookie, not
// localStorage.
export function ensureVisitorId(): void {
  if (typeof document === 'undefined') return
  const exists = document.cookie
    .split('; ')
    .some(c => c.startsWith('acme_visitor_id='))
  if (exists) return

  const id = crypto.randomUUID()
  const maxAge = 60 * 60 * 24 * 365
  document.cookie = `acme_visitor_id=${id}; path=/; max-age=${maxAge}; SameSite=Lax`
}

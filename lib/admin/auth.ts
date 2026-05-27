// ─── Password verification ────────────────────────────────────────────────────
// Plan 1: compares plain-text against ADMIN_PASSWORD env var
// Plan 2: swap the body to:
//   const bcrypt = await import('bcryptjs')
//   return bcrypt.compare(input, process.env.ADMIN_PASSWORD_HASH ?? '')
export async function verifyPassword(input: string): Promise<boolean> {
  return input === process.env.ADMIN_PASSWORD
}

// ─── Session shape ────────────────────────────────────────────────────────────
// Extend this when you add roles or Shopify staff data in Plan 2
export interface AdminSession {
  isLoggedIn: boolean
}

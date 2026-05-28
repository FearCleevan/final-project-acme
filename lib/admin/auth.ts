// ─── Password verification ────────────────────────────────────────────────────
// Compares against ADMIN_PASSWORD env var (plain-text, stored securely in Vercel).
// bcrypt hashing is planned for a future sprint once the base integration is stable.
export async function verifyPassword(input: string): Promise<boolean> {
  return input === process.env.ADMIN_PASSWORD
}

// ─── Session shape ────────────────────────────────────────────────────────────
export interface AdminSession {
  isLoggedIn: boolean
}

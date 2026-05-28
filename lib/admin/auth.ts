import bcrypt from 'bcryptjs'

// ─── Password verification ────────────────────────────────────────────────────
// Uses bcrypt hash from ADMIN_PASSWORD_HASH env var.
// To generate a new hash run:
//   node -e "require('bcryptjs').hash('yourpassword',12).then(console.log)"
export async function verifyPassword(input: string): Promise<boolean> {
  const hash = process.env.ADMIN_PASSWORD_HASH
  if (!hash) {
    // Fallback to plain-text for local dev only — never set in production
    return input === process.env.ADMIN_PASSWORD
  }
  return bcrypt.compare(input, hash)
}

// ─── Session shape ────────────────────────────────────────────────────────────
export interface AdminSession {
  isLoggedIn: boolean
}

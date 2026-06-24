import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendContactAdminAlert } from '@/lib/email'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  try {
    const body    = await req.json()
    const { name, email, subject, message } = body

    if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
      return NextResponse.json({ success: false, error: 'All fields required' }, { status: 400 })
    }

    const { error } = await getSupabase()
      .from('contact_messages')
      .insert({
        name:    name.trim(),
        email:   email.trim(),
        subject: subject.trim(),
        message: message.trim(),
      })

    if (error) throw error

    // Fire-and-forget — don't fail the user's submission if email fails
    sendContactAdminAlert({ name, email, subject, message }).catch(console.error)

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false }, { status: 500 })
  }
}

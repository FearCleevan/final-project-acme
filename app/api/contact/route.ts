import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, subject, message } = body

    const params = new URLSearchParams({ name, email, subject, message })
    const res = await fetch(process.env.CONTACT_SCRIPT_URL!, {
      method: 'POST',
      body: params,
    })

    const json = await res.json()
    return NextResponse.json(json)
  } catch {
    return NextResponse.json({ success: false }, { status: 500 })
  }
}

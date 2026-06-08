import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ success: false }, { status: 400 })

    const params = new URLSearchParams({ type: 'newsletter', email })
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

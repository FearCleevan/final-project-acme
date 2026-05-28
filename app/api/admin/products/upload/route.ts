import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions } from '@/lib/admin/session'
import type { AdminSession } from '@/lib/admin/auth'

const DOMAIN  = process.env.SHOPIFY_STORE_DOMAIN!
const TOKEN   = process.env.SHOPIFY_ADMIN_TOKEN!
const GQL_URL = `https://${DOMAIN}/admin/api/2026-04/graphql.json`

export async function POST(req: NextRequest) {
  const session = await getIronSession<AdminSession>(await cookies(), sessionOptions)
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const filename    = file.name
  const mimeType    = file.type
  const fileSize    = file.size

  // Step 1: Request staged upload target from Shopify
  const stageRes = await fetch(GQL_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': TOKEN },
    body: JSON.stringify({
      query: `mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
        stagedUploadsCreate(input: $input) {
          stagedTargets {
            url
            resourceUrl
            parameters { name value }
          }
          userErrors { field message }
        }
      }`,
      variables: {
        input: [{
          filename,
          mimeType,
          fileSize: String(fileSize),
          httpMethod: 'POST',
          resource: 'IMAGE',
        }],
      },
    }),
  })

  const stageData = await stageRes.json()
  const target    = stageData?.data?.stagedUploadsCreate?.stagedTargets?.[0]
  if (!target) return NextResponse.json({ error: 'Failed to get upload target' }, { status: 500 })

  // Step 2: Upload the file to the staged URL
  const uploadForm = new FormData()
  target.parameters.forEach((p: { name: string; value: string }) => {
    uploadForm.append(p.name, p.value)
  })
  uploadForm.append('file', file)

  const uploadRes = await fetch(target.url, { method: 'POST', body: uploadForm })
  if (!uploadRes.ok) return NextResponse.json({ error: 'Upload to Shopify CDN failed' }, { status: 500 })

  return NextResponse.json({ url: target.resourceUrl })
}

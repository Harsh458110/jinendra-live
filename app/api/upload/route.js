import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(req) {
  const formData = await req.formData()
  const file = formData.get('file')
  if (!file) return Response.json({ error: 'No file' }, { status: 400 })

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const ext = file.name.split('.').pop()
  const fileName = `products/${Date.now()}.${ext}`

  const { error } = await admin.storage
    .from('product-images')
    .upload(fileName, buffer, { contentType: file.type, upsert: true })

  if (error) return Response.json({ error: error.message }, { status: 500 })

  const { data: urlData } = admin.storage
    .from('product-images')
    .getPublicUrl(fileName)

  return Response.json({ url: urlData.publicUrl })
}

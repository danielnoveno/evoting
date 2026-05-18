import { promises as fs } from 'fs'
import path from 'path'

export async function GET() {
  const logoPath = path.resolve(process.cwd(), 'public/favicon.png')
  const file = await fs.readFile(logoPath)

  return new Response(file, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}

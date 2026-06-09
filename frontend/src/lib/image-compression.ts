/**
 * Client-side image compression utility.
 *
 * Compresses an image File to WebP format at specified quality,
 * then returns a new File suitable for upload.
 *
 * - Converts to WebP automatically (widely supported in modern browsers).
 * - Quality 0.5 = ~50% compression ratio relative to original JPEG.
 * - Preserves original pixel dimensions (no resizing).
 */

export async function compressImage(file: File, quality = 0.5): Promise<File> {
  // Skip non-image files (PDF, CSV, etc.)
  if (!file.type.startsWith('image/')) return file

  // Skip WebP that's already small enough (< 100 KB)
  if (file.type === 'image/webp' && file.size < 100_000) return file

  const image = await loadImage(file)
  const canvas = document.createElement('canvas')

  // Preserve original dimensions
  canvas.width = image.naturalWidth
  canvas.height = image.naturalHeight

  const ctx = canvas.getContext('2d')
  if (!ctx) return file // fallback if Canvas not supported

  ctx.drawImage(image, 0, 0)

  return new Promise<File>((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const webpFile = new File([blob], replaceExtension(file.name, 'webp'), {
            type: 'image/webp',
          })
          resolve(webpFile)
        } else {
          // Fallback: return original if encoding fails
          resolve(file)
        }
      },
      'image/webp',
      quality,
    )
  })
}

/** Load a File into an HTMLImageElement */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Gagal memuat gambar'))
    }
    img.src = url
  })
}

/** Replace file extension with a new one */
function replaceExtension(filename: string, newExt: string): string {
  const dotIndex = filename.lastIndexOf('.')
  const base = dotIndex > -1 ? filename.slice(0, dotIndex) : filename
  return `${base}.${newExt}`
}

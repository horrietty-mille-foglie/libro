import imageCompression from 'browser-image-compression'

const SUPPORTED_TYPES = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
  'image/webp', 'image/heic', 'image/heif',
]

export async function processImageFile(file) {
  const type = file.type.toLowerCase()
  const name = file.name.toLowerCase()
  const isHeic = type === 'image/heic' || type === 'image/heif'
    || name.endsWith('.heic') || name.endsWith('.heif')

  if (!isHeic && !SUPPORTED_TYPES.includes(type)) {
    throw new Error('対応していない画像形式です')
  }

  try {
    let sourceFile = file

    if (isHeic) {
      const heic2any = (await import('heic2any')).default
      const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 })
      const blob = Array.isArray(converted) ? converted[0] : converted
      sourceFile = new File([blob], file.name.replace(/\.heic$/i, '.jpg'), { type: 'image/jpeg' })
    }

    const compressed = await imageCompression(sourceFile, {
      maxSizeMB: 5,
      maxWidthOrHeight: 2000,
      initialQuality: 0.9,
      useWebWorker: true,
    })

    const mimeType = isHeic ? 'image/jpeg' : (sourceFile.type || 'image/jpeg')
    const extension = mimeType === 'image/png' ? 'png'
      : mimeType === 'image/webp' ? 'webp'
      : 'jpg'

    return { blob: compressed, extension, mimeType }
  } catch (err) {
    if (err.message === '対応していない画像形式です') throw err
    throw new Error('画像の処理に失敗しました')
  }
}

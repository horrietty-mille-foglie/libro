import { useEffect, useState } from 'react'
import { getSignedImageUrl } from '../lib/storage'

export default function BookCover({
  coverUrl,
  alt = '',
  imgClassName = 'w-full h-full object-cover',
  placeholderClassName = 'text-gray-300 dark:text-gray-500 text-4xl select-none',
}) {
  const [resolvedUrl, setResolvedUrl] = useState(
    coverUrl?.startsWith('http') ? coverUrl : null
  )

  useEffect(() => {
    if (!coverUrl) { setResolvedUrl(null); return }
    if (coverUrl.startsWith('http://') || coverUrl.startsWith('https://')) {
      setResolvedUrl(coverUrl)
      return
    }
    let cancelled = false
    getSignedImageUrl(coverUrl)
      .then(url => { if (!cancelled) setResolvedUrl(url) })
      .catch(() => { if (!cancelled) setResolvedUrl(null) })
    return () => { cancelled = true }
  }, [coverUrl])

  if (resolvedUrl) {
    return <img src={resolvedUrl} alt={alt} className={imgClassName} />
  }
  return <span className={placeholderClassName}>📖</span>
}

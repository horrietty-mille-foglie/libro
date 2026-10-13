/**
 * 「戻る」操作の共通処理。
 *
 * react-router は history.state に履歴インデックス（idx）を持っている。
 * idx > 0 なら戻れる履歴があるので navigate(-1)、
 * idx が 0 または不明な場合（URL を直接開いた・PWA の起動直後など）は
 * 戻り先がないため fallback へ replace で遷移する。
 */
export function goBack(navigate, fallback) {
  const idx = window.history.state?.idx
  if (typeof idx === 'number' && idx > 0) {
    navigate(-1)
  } else {
    navigate(fallback, { replace: true })
  }
}

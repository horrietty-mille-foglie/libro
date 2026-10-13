import { useEffect } from 'react'

// 同時に開いているモーダルの数。複数重なっても最後の1つが閉じるまで解除しない。
let lockCount = 0
let savedStyles = null

/**
 * モーダル表示中、背景のスクロールを止めるフック。
 *
 * - カウンタ方式。入れ子で開いても、最後の1つが閉じるまで解除しない
 * - overscroll-behavior: contain で、下に引っ張って更新する操作も止める
 */
export function useScrollLock(enabled = true) {
  useEffect(() => {
    if (!enabled) return

    lockCount += 1
    if (lockCount === 1) {
      const body = document.body
      const html = document.documentElement
      savedStyles = {
        bodyOverflow:   body.style.overflow,
        bodyOverscroll: body.style.overscrollBehavior,
        htmlOverscroll: html.style.overscrollBehavior,
      }
      body.style.overflow = 'hidden'
      body.style.overscrollBehavior = 'contain'
      html.style.overscrollBehavior = 'contain'
    }

    return () => {
      lockCount -= 1
      if (lockCount === 0 && savedStyles) {
        const body = document.body
        const html = document.documentElement
        body.style.overflow = savedStyles.bodyOverflow
        body.style.overscrollBehavior = savedStyles.bodyOverscroll
        html.style.overscrollBehavior = savedStyles.htmlOverscroll
        savedStyles = null
      }
    }
  }, [enabled])
}

export default useScrollLock

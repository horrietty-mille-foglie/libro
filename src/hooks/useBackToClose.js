import { useEffect, useRef } from 'react'

// 開いているモーダルの印（ID）を積むスタック。
// 入れ子で開いた場合、戻る操作で上から1つずつ閉じるために使う。
const openStack = []
let seq = 0

// 自前で呼んだ history.back() の予約数と、処理中の popstate がそれによるものかの判定。
let selfBacks = 0
let ignoringSelfBack = false
let gateInstalled = false

// 自前の back() による popstate を見分けるゲート。
// 最初のフック利用時に1つだけ登録するので、各モーダルのリスナーより先に動く。
function installGate() {
  if (gateInstalled) return
  gateInstalled = true
  window.addEventListener('popstate', () => {
    if (selfBacks > 0) {
      selfBacks -= 1
      ignoringSelfBack = true
      // 同じ popstate に対する各モーダルのリスナーはすべて同期的に動くため、
      // マイクロタスクで解除すればそのイベントの間だけ無視できる。
      queueMicrotask(() => { ignoringSelfBack = false })
    }
  })
}

function selfBack() {
  selfBacks += 1
  window.history.back()
}

/**
 * Android の戻る操作（popstate）でモーダルを閉じるためのフック。
 * モーダル本体のコンポーネント（開いている間だけ描画されるもの）から呼ぶ。
 *
 * - 開いたときに history.pushState で印付きの履歴を1つ積む
 * - 戻る操作でその印から出たら onClose() を呼ぶ
 * - 画面上のボタンで閉じた（= アンマウントされた）場合は、
 *   積んだ履歴を history.back() で取り除く
 * - モーダルを開いたまま別画面へ遷移した場合は history.back() を呼ばない
 *   （余計な戻りが発生しないようにする）
 * - 入れ子のモーダルは、戻る操作で上から1つずつ閉じる
 *
 * pushState の state には window.history.state を展開して渡す。
 * react-router は history.state.idx で履歴位置を管理しているため、
 * これを引き継がないと router 側の「戻る」がずれる。
 */
export function useBackToClose(onClose, enabled = true) {
  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose }, [onClose])

  // 戻る操作で閉じた場合は null になる（= cleanup で history.back() しない）
  const myIdRef = useRef(null)

  useEffect(() => {
    if (!enabled) return

    installGate()

    const id = ++seq
    myIdRef.current = id
    openStack.push(id)
    window.history.pushState({ ...window.history.state, __modal: id }, '')

    const handlePopState = () => {
      // 自前の back() による popstate は無視する
      if (ignoringSelfBack) return
      // 入れ子のときは最上位のモーダルだけが反応する
      if (openStack[openStack.length - 1] !== id) return
      // まだ自分の印の履歴にいる場合は閉じない
      if (window.history.state?.__modal === id) return
      openStack.pop()
      myIdRef.current = null
      onCloseRef.current?.()
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
      const i = openStack.lastIndexOf(id)
      if (i !== -1) openStack.splice(i, 1)
      // 画面上のボタンで閉じた場合のみ、積んだ印を取り除く。
      // 別画面へ遷移した場合は履歴の先頭が印ではないので、何もしない
      // （余計な戻りが発生しない）。
      if (myIdRef.current === id && typeof window.history.state?.__modal === 'number') {
        selfBack()
      }
      myIdRef.current = null
    }
  }, [enabled])
}

export default useBackToClose

import { useEffect, useRef, useState } from 'react'
import { fetchTags, createTag } from '../lib/api'

export default function TagInput({ selectedTagIds, onChange }) {
  const [allTags, setAllTags] = useState([])
  const [adding, setAdding] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    fetchTags().then(setAllTags).catch(() => {})
  }, [])

  useEffect(() => {
    if (adding) inputRef.current?.focus()
  }, [adding])

  const toggleTag = (tagId) => {
    const next = selectedTagIds.includes(tagId)
      ? selectedTagIds.filter(id => id !== tagId)
      : [...selectedTagIds, tagId]
    onChange(next)
  }

  const handleAddTag = async () => {
    const name = inputValue.trim()
    if (!name) { setAdding(false); return }
    setCreating(true)
    setError('')
    try {
      const tag = await createTag(name)
      setAllTags(prev => {
        if (prev.find(t => t.id === tag.id)) return prev
        return [...prev, tag].sort((a, b) => a.name.localeCompare(b.name, 'ja'))
      })
      if (!selectedTagIds.includes(tag.id)) {
        onChange([...selectedTagIds, tag.id])
      }
      setInputValue('')
      setAdding(false)
    } catch {
      setError('タグの作成に失敗しました')
    } finally {
      setCreating(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); handleAddTag() }
    if (e.key === 'Escape') { setAdding(false); setInputValue('') }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">タグ</label>
      <div className="flex flex-wrap gap-2 items-center">
        {allTags.map(tag => {
          const selected = selectedTagIds.includes(tag.id)
          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleTag(tag.id)}
              className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                selected
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tag.name}
            </button>
          )
        })}

        {adding ? (
          <div className="flex items-center gap-1">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleAddTag}
              disabled={creating}
              placeholder="タグ名"
              className="border border-blue-400 rounded-full px-3 py-1 text-xs focus:outline-none w-28"
            />
            {creating && <span className="text-xs text-gray-400">作成中…</span>}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="text-xs px-3 py-1 rounded-full border border-dashed border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors"
          >
            + 新しいタグ
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

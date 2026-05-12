import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { fetchUserSettings, upsertUserSettings } from '../lib/api'

const UserSettingsContext = createContext(null)

const DEFAULT_SETTINGS = { theme: 'light', list_view_mode: 'grid' }

const MQ = window.matchMedia('(prefers-color-scheme: dark)')

function applyTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark')
  } else if (theme === 'light') {
    document.documentElement.classList.remove('dark')
  } else {
    document.documentElement.classList.toggle('dark', MQ.matches)
  }
}

export function UserSettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const mqHandlerRef = useRef(null)

  const setupSystemListener = (theme) => {
    if (mqHandlerRef.current) {
      MQ.removeEventListener('change', mqHandlerRef.current)
      mqHandlerRef.current = null
    }
    if (theme === 'system') {
      const handler = (e) => document.documentElement.classList.toggle('dark', e.matches)
      MQ.addEventListener('change', handler)
      mqHandlerRef.current = handler
    }
  }

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      try {
        const data = await fetchUserSettings()
        const effective = data
          ? { theme: data.theme, list_view_mode: data.list_view_mode }
          : DEFAULT_SETTINGS
        setSettings(effective)
        applyTheme(effective.theme)
        setupSystemListener(effective.theme)
      } catch {
        applyTheme(DEFAULT_SETTINGS.theme)
      }
    }
    load()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setupSystemListener('light')
        setSettings(DEFAULT_SETTINGS)
        applyTheme(DEFAULT_SETTINGS.theme)
      }
    })

    return () => {
      subscription.unsubscribe()
      if (mqHandlerRef.current) MQ.removeEventListener('change', mqHandlerRef.current)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const updateTheme = async (theme) => {
    setSettings(prev => ({ ...prev, theme }))
    applyTheme(theme)
    setupSystemListener(theme)
    try { await upsertUserSettings({ theme }) } catch {}
  }

  const updateListViewMode = async (list_view_mode) => {
    setSettings(prev => ({ ...prev, list_view_mode }))
    try { await upsertUserSettings({ list_view_mode }) } catch {}
  }

  return (
    <UserSettingsContext.Provider value={{ settings, updateTheme, updateListViewMode }}>
      {children}
    </UserSettingsContext.Provider>
  )
}

export function useUserSettings() {
  return useContext(UserSettingsContext)
}

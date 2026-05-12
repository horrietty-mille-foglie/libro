import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { UserSettingsProvider } from './contexts/UserSettingsContext'
import Login from './pages/Login'
import AuthCallback from './pages/AuthCallback'
import Dashboard from './pages/Dashboard'
import BookNew from './pages/BookNew'
import BookDetail from './pages/BookDetail'
import NoteEditor from './pages/NoteEditor'
import Search from './pages/Search'
import Settings from './pages/Settings'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <UserSettingsProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/books/new" element={<ProtectedRoute><BookNew /></ProtectedRoute>} />
          <Route path="/books/:id" element={<ProtectedRoute><BookDetail /></ProtectedRoute>} />
          <Route path="/books/:bookId/notes/new" element={<ProtectedRoute><NoteEditor /></ProtectedRoute>} />
          <Route path="/books/:bookId/notes/:noteId/edit" element={<ProtectedRoute><NoteEditor /></ProtectedRoute>} />
          <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </UserSettingsProvider>
  )
}

export default App

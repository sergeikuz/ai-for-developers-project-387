import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import EventCatalogPage from './pages/EventCatalogPage'
import BookingPage from './pages/BookingPage'
import AdminPage from './pages/AdminPage'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="book" element={<EventCatalogPage />} />
        <Route path="book/:id" element={<BookingPage />} />
        <Route path="admin" element={<AdminPage />} />
      </Route>
    </Routes>
  )
}

export default App

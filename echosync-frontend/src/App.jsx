import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import GuestView from './pages/GuestView'
import AdminDashboard from './pages/AdminDashboard'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<GuestView />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

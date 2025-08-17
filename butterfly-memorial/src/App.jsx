import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import GardenCreation from './pages/create'


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/create" element={<GardenCreation />} />
      </Routes>
    </Router>
  )
}

export default App
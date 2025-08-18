import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import GardenCreation from './pages/create'
import Garden from './pages/garden';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/create" element={<GardenCreation />} />
        <Route path="/garden" element={<Garden />} />
      </Routes>
    </Router>
  )
}

export default App
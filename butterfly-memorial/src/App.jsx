import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import GardenCreation from './pages/create'
import Garden from './pages/garden';
import About from './pages/About';
import Pricing from './pages/Pricing';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/create" element={<GardenCreation />} />
        <Route path="/garden/:gardenId" element={<Garden />} />
  <Route path="/about" element={<About />} />
  <Route path="/pricing" element={<Pricing />} />
      </Routes>
    </Router>
  )
}

export default App
import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import GardenCreation from './pages/create'
import Garden from './pages/garden';
import Profile from './pages/Profile';
import About from './pages/About';
import FAQ from './pages/FAQ';
import Contact from './pages/Contact';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<About />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/create" element={<GardenCreation />} />
        <Route path="/garden/:gardenId" element={<Garden />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Router>
  )
}

export default App
import React from 'react'
import { Link } from 'react-router-dom'

function LandingPage() {
  return (
    <div>
      <h1>Landing Page</h1>
      <h2>Test reload</h2>
      <Link to="/garden">Go to Garden</Link>
    </div>
  )
}

export default LandingPage
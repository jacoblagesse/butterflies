import React from 'react'
import garden from "../assets/backgrounds/garden.png"

export default function Canvas() {
  return (
    <div style={{width: "100%"}}>
        <img src={garden} alt="Background" style={{width: "80vw", margin: 0}}/>
    </div>
  )
}
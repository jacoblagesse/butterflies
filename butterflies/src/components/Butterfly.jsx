import React from 'react'

// Butterfly gifs
// Will likely need to make these dynamic imports once multiple butterflies
import front from './../assets/front.gif'
import flyleft from './../assets/flyleft.gif'
import flyright from './../assets/flyright.gif'

export default function Butterfly() {
  return (
    <div>Butterfly</div>
  )
}


// function createButterfly(direction) {
//     const butterfly = document.createElement('img');
//     butterfly.src = direction === 'right' ? 'assets/flyright.gif' : 'assets/flyleft.gif'; // Update with your butterfly images
//     butterfly.style.position = 'absolute';
//     butterfly.style.width = '100px'; // Adjust size as needed
//     butterfly.style.height = 'auto';

//     // Random initial position
//     butterfly.posX = Math.random() * windowWidth;
//     butterfly.posY = Math.random() * windowHeight;
//     butterfly.velocityX = 0.2 + Math.random() * 1; // Random horizontal speed
//     butterfly.velocityY = 0.1 + Math.random() * 1; // Random vertical speed
//     butterfly.bobbingAmplitude = 5; // Height of the bobbing effect
//     butterfly.bobbingFrequency = 0.03; // Random frequency
//     butterfly.time = 0; // Time variable for sine wave

//     document.body.appendChild(butterfly);
//     return butterfly;
// }

// // Create multiple butterflies
// for (let i = 0; i < numButterflies; i++) {
//     const direction = Math.random() < 0.5 ? 'right' : 'left'; // Randomly choose direction
//     butterflies.push(createButterfly(direction));
// }

// function animate() {
//     butterflies.forEach(butterfly => {
//         // Update position
//         butterfly.posX += butterfly.velocityX;
//         butterfly.posY += butterfly.velocityY + Math.sin(butterfly.time) * (butterfly.bobbingAmplitude / 10); // Incorporate Y velocity and bobbing

//         // Check for collision with walls
//         if (butterfly.posX <= 0) {
//             butterfly.velocityX = -butterfly.velocityX; // Reverse direction on X axis
//             butterfly.src = 'assets/flyright.gif'; // Change to right image
//         } else if (butterfly.posX >= windowWidth - butterfly.width) {
//             butterfly.velocityX = -butterfly.velocityX; // Reverse direction on X axis
//             butterfly.src = 'assets/flyleft.gif'; // Change to left image
//         }
//         if (butterfly.posY <= 0 || butterfly.posY >= windowHeight - butterfly.height) {
//             butterfly.velocityY = -butterfly.velocityY; // Reverse direction on Y axis
//             butterfly.posY = Math.max(0, Math.min(butterfly.posY, windowHeight - butterfly.height)); // Ensure it stays within bounds
//         }

//         // Set new position
//         butterfly.style.left = `${butterfly.posX}px`;
//         butterfly.style.top = `${butterfly.posY}px`;

//         butterfly.time += butterfly.bobbingFrequency; // Increment time for the sine wave
//     });

//     requestAnimationFrame(animate); // Loop the animation
// }

// // Start the animation
// animate();
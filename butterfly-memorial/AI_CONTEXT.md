# 🦋 Spirit Butterfly - AI Context Document

> A memorial web application where users create virtual butterfly gardens to remember loved ones. Family and friends can release animated butterflies carrying personalized messages.

---

## Project Overview

**Name:** Spirit Butterfly (butterfly-memorial)  
**Type:** Single Page Application (SPA)  
**Purpose:** Digital memorial platform for honoring deceased loved ones through interactive butterfly gardens

### Core Concept
- Users create a personalized **garden** dedicated to a deceased loved one (the **honoree**)
- Family and friends visit the garden and **release butterflies** with messages of love
- Butterflies fly around the garden in a realistic, physics-based animation
- Hovering over a butterfly reveals the sender's name and message

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend Framework** | React 19 with JSX |
| **Build Tool** | Vite 7 |
| **Routing** | React Router DOM 7 |
| **Backend/Database** | Firebase (Firestore, Analytics) |
| **Payments** | Stripe (React Stripe.js) |
| **Styling** | CSS with CSS Variables (custom design system) |
| **Deployment** | Firebase Hosting + Docker support |

---

## Project Structure

```
butterfly-memorial/
├── src/
│   ├── App.jsx              # Main app with routing setup
│   ├── main.jsx             # React entry point
│   ├── firebase.js          # Firebase configuration & exports
│   ├── assets/
│   │   ├── backgrounds/     # Garden background images (GIFs)
│   │   ├── butterflies/     # Butterfly sprites by color
│   │   │   ├── blue/        # flying.gif, resting.gif
│   │   │   ├── green/
│   │   │   ├── orange/
│   │   │   ├── pink/
│   │   │   ├── purple/
│   │   │   └── yellow/
│   │   ├── chrysalis/       # Hatching animation GIFs
│   │   ├── logos/           # Brand assets
│   │   └── misc/            # Other assets (hatch.gif)
│   ├── components/
│   │   ├── FlyingButterfly.jsx   # Individual butterfly renderer
│   │   ├── GardenControls.jsx    # Release panel & butterfly list
│   │   ├── Header.jsx
│   │   └── Navbar.jsx
│   ├── hooks/
│   │   └── useButterflyPhysics.js  # Physics simulation hook
│   └── pages/
│       ├── LandingPage.jsx   # Homepage with hero section
│       ├── create.jsx        # 4-step garden creation wizard
│       ├── garden.jsx        # Main garden view
│       ├── About.jsx / AboutPage.jsx
│       ├── Pricing.jsx / PricingPage.jsx
│       └── spirit-butterfly.css  # Main stylesheet
├── public/                   # Static assets
├── package.json
├── vite.config.js
├── firebase.json             # Firebase hosting config
├── Dockerfile
└── docker-compose.yml
```

---

## Application Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/` | `LandingPage` | Homepage with hero, pricing tiers |
| `/create` | `GardenCreation` | 4-step wizard to create a garden |
| `/garden/:gardenId` | `Garden` | View and interact with a garden |
| `/pricing` | `Pricing` | Butterfly purchase options |
| `/about` | `About` | About the service |

---

## Firebase Data Models

### Collection: `gardens`
```javascript
{
  id: string,           // Auto-generated
  name: string,         // Garden name
  user: string,         // Reference path to user doc
  style: string,        // Background theme key: "mountain" | "tropical" | "lake"
  honoree: Reference,   // Firestore reference to honoree doc
  created: Timestamp
}
```

### Collection: `honoree`
```javascript
{
  id: string,           // Auto-generated
  first_name: string,
  last_name: string,
  dates: string,        // e.g., "1950–2024"
  obit: string,         // Short dedication message
  obituary_url: string, // Optional external obituary link
  created: Timestamp
}
```

### Collection: `butterflies`
```javascript
{
  id: string,           // Auto-generated
  gifter: string,       // Name of person releasing butterfly
  message: string,      // Memorial message
  garden: Reference,    // Firestore reference to garden
  gardenId: string,     // Garden ID (for querying)
  color: string,        // Butterfly color: "blue" | "green" | "orange" | "pink" | "purple" | "yellow"
  created: Timestamp
}
```

---

## Key Features & Components

### 1. Garden Creation Wizard (`create.jsx`)
- **Step 1:** Choose background theme (Mountain, Tropical, Lake)
- **Step 2:** Enter honoree details (name, dates, dedication, obituary URL)
- **Step 3:** Preview (currently step 3 shows preview)
- **Step 4:** Confirmation
- Creates `honoree` document, then `garden` document referencing it

### 2. Butterfly Physics System (`useButterflyPhysics.js`)
Custom React hook managing butterfly flight simulation:
- **Spawning:** Butterflies enter from off-screen edges
- **Flight:** Linear motion with sinusoidal vertical bobbing
- **Depth:** Y-position affects size (parallax/depth effect)
- **Landing:** Random chance to land in bottom 40% of screen
- **Resting:** Land for 5-30 seconds, then take off
- **Respawn:** After exiting screen, wait then re-enter

### 3. Flying Butterfly Component (`FlyingButterfly.jsx`)
- Renders butterfly GIF sprite (flying or resting state)
- Dynamic color resolution via `import.meta.glob`
- Hover interactions reveal message card
- Direction flip via CSS `scaleX`

### 4. Garden Controls (`GardenControls.jsx`)
- **Butterfly List:** View all butterflies and their messages
- **Release Panel:** Form to enter name, message, select color
- **Hatching Animation:** Full-screen chrysalis hatching GIF
- Writes to `butterflies` collection on release

### 5. Hover Card System (`garden.jsx`)
- Mouse-following tooltip shows butterfly sender & message
- Viewport-clamped positioning
- Freezes butterfly position during hover

---

## Design System

### CSS Variables (`:root`)
```css
--ink: #1f2a37          /* Primary text */
--muted: #5b6470        /* Secondary text */
--accent: #6c62ff       /* Violet wing color */
--accent-2: #6ec3ff     /* Sky blue wing color */
--cta: #5e8b7e          /* Sage green CTA buttons */
--card: #ffffffcc       /* Glass-morphism cards */
--r-lg: 28px            /* Large border radius */
--r-md: 16px            /* Medium border radius */
```

### Typography
- **Headers:** Playfair Display (serif)
- **Body:** Inter (sans-serif)

### Key CSS Classes
- `.page` - Full-height page container
- `.wrap` - Centered content wrapper (max-width: 1200px)
- `.hero-card` - Glass-morphism card with blur effect
- `.btn.primary` - Sage green primary button
- `.btn.ghost` - White outlined button
- `.flying-butterfly` - Positioned butterfly element

---

## Asset Naming Conventions

### Butterfly Sprites
```
src/assets/butterflies/{color}/flying.gif   # In-flight animation
src/assets/butterflies/{color}/resting.gif  # Landed/resting state
```

### Chrysalis (Hatching)
```
src/assets/chrysalis/chrysalis-{color}.gif  # Color-matched hatching animation
```

### Backgrounds
```
src/assets/backgrounds/background_{theme}__HD.gif  # Animated garden backgrounds
```

---

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (Vite)
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

---

## Key Implementation Details

### Butterfly Color Resolution
Colors are resolved dynamically using Vite's `import.meta.glob`:
```javascript
const mapFlying = import.meta.glob('/src/assets/butterflies/*/flying.*', { eager: true });
```

### Real-time Updates
Garden page uses Firestore `onSnapshot` for live butterfly additions:
```javascript
onSnapshot(query(collection(db, "butterflies"), where("gardenId", "==", gardenId)), ...)
```

### Physics Update Loop
Uses `requestAnimationFrame` with throttled React state updates (~10Hz) for smooth animation while minimizing re-renders.

---

## Monetization Model

Butterfly purchases (pricing shown in Japanese Yen):
- 1 Butterfly: ¥300
- 5 Butterflies: ¥1,200
- 20 Butterflies: ¥4,200

Stripe integration is installed but payment flow implementation details are in pricing pages.

---

## Potential Areas for Enhancement

1. **Authentication:** `AuthPopup` component referenced but not found - auth system may be incomplete
2. **User Management:** User collection and ownership not fully implemented
3. **Butterfly Limits:** No apparent limit on butterfly releases per user
4. **Mobile Optimization:** Physics may need touch event handling
5. **Sharing:** Social sharing features for garden links
6. **Admin Panel:** Garden management for creators
7. **Notifications:** Email/push when new butterflies are released

---

## Environment & Configuration

### Firebase Project
- **Project ID:** butterfly-memorial
- **Auth Domain:** butterfly-memorial.firebaseapp.com
- **Storage Bucket:** butterfly-memorial.firebasestorage.app

### Security Note
Firebase API keys are client-side and protected by Firebase Security Rules (should be configured in Firebase Console).

---

## Quick Reference for Common Tasks

### Adding a New Butterfly Color
1. Create folder: `src/assets/butterflies/{newcolor}/`
2. Add `flying.gif` and `resting.gif`
3. Optionally add `src/assets/chrysalis/chrysalis-{newcolor}.gif`
4. Colors are auto-discovered via `import.meta.glob`

### Adding a New Background Theme
1. Add image to `src/assets/backgrounds/`
2. Update `BACKGROUNDS` array in `create.jsx`
3. Add to `BACKGROUNDS` object in `garden.jsx`

### Modifying Butterfly Behavior
Edit `src/hooks/useButterflyPhysics.js`:
- `bobbingSpeed`: Vertical oscillation rate
- `vx/vy`: Movement velocity
- `landUntil`: Rest duration (currently 5-30s)
- `bottomThreshold`: Landing zone (currently bottom 50%)

---

*Generated: January 24, 2026*

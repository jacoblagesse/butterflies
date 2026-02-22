# Butterfly Memorial — Project Guide

A memorial garden web app where visitors release butterflies carrying messages for loved ones. Built with React 19, Firebase, Stripe, and Vite.

**Live project**: Hosted on Firebase Hosting (`butterfly-memorial.firebaseapp.com`)

---

## Quick Start

```bash
npm install                        # Frontend deps
cd functions && npm install && cd ..  # Cloud function deps
npm run dev                        # Vite dev server (localhost:5173)
firebase emulators:start --only functions  # Local Stripe/payment testing
npm run build                      # Production build → dist/
firebase deploy                    # Deploy hosting + functions
```

Environment variables live in `.env.local` (not committed). Required keys:
- `VITE_FIREBASE_*` — Firebase config (API key, project ID, etc.)
- `VITE_STRIPE_PUBLISHABLE_KEY` — Stripe publishable key (`pk_test_*` for dev)

The Stripe secret key is a Firebase secret (`STRIPE_SECRET_KEY`) accessed via `defineSecret` in Cloud Functions.

---

## Architecture

```
src/
  App.jsx              # React Router setup
  firebase.js          # Firebase SDK init, auth helpers, callable functions
  pages/
    LandingPage.jsx    # Homepage with search
    create.jsx         # 4-step garden creation wizard
    garden.jsx         # Full-screen interactive garden view
    Profile.jsx        # User's garden list
    Pricing.jsx        # Butterfly pricing tiers
    About.jsx          # About page
    spirit-butterfly.css  # Master stylesheet (all design tokens + components)
  components/
    GardenControls.jsx # 3-step buy wizard + butterfly list panel
    CheckoutForm.jsx   # Stripe PaymentElement form
    FlyingButterfly.jsx # Individual butterfly renderer
    PageLayout.jsx     # Reusable layout with ambient butterflies
    VideoBackground.jsx # Lazy-loaded video/image backgrounds
    Header.jsx         # Nav bar with auth dropdown
    AuthPopup.jsx      # Sign in / sign up / reset modal
  hooks/
    useButterflyPhysics.js  # Physics simulation (~30Hz render, 60Hz update)
  contexts/
    AuthContext.jsx     # Firebase auth state provider
  assets/
    butterflies/{color}/flying.gif, resting.gif  # 6 colors
    chrysalis/chrysalis-{color}.gif              # Hatch animations
    backgrounds/                                  # Video + image BGs
functions/
  index.js             # createPaymentIntent, confirmPayment (Stripe)
```

### Routes

| Path | Component | Auth Required |
|------|-----------|:---:|
| `/` | LandingPage | No |
| `/create` | GardenCreation | Yes (to save) |
| `/garden/:gardenId` | Garden | No |
| `/pricing` | Pricing | No |
| `/about` | About | No |
| `/profile` | Profile | Yes |

---

## Design System

All tokens and component styles live in `src/pages/spirit-butterfly.css`.

### Color Palette
| Token | Value | Usage |
|-------|-------|-------|
| `--ink` | `#2c2836` | Primary text (soft charcoal) |
| `--muted` | `#6b6578` | Secondary text (plum-grey) |
| `--accent` | `#9b8ec4` | Highlights (soft lavender) |
| `--accent-2` | `#d4a9c7` | Dusty rose accents |
| `--cta` | `#7d6b91` | Button backgrounds (muted amethyst) |
| `--cta-hover` | `#6a5a7d` | Button hover |
| `--card` | `rgba(255,255,253,0.82)` | Glass card backgrounds |
| `--card-solid` | `#fffdf9` | Opaque card backgrounds |
| `--border` | `#e8e2ee` | Lavender borders |

### Typography
- **Headings**: `Playfair Display` (serif) — elegant, warm
- **Body**: `Inter` (sans-serif) — clean, readable
- Sizes: `--fs-base: 16px`, `--fs-sub: 17px`, `--fs-btn: 15px`, `--fs-small: 14px`

### Border Radii
- `--r-lg: 24px` (cards, modals)
- `--r-md: 16px` (medium elements)
- `--r-sm: 12px` (buttons, inputs)

### Key CSS Classes
- `.hero-card` — Glass-morphism surface (blur, shadow, semi-transparent)
- `.card` — Standard content card
- `.btn.primary` — CTA button (amethyst bg, white text)
- `.btn.ghost` — Secondary button (white bg, border)
- `.in` — Text input / textarea
- `.eyebrow` — Uppercase pill label (e.g., "Step 1 of 3")
- `.sub` — Muted secondary text
- `.cta-row` — Flex row for button groups
- `.slide-forward` / `.slide-back` — Step transition animations (0.38s)

### Glass-Morphism Pattern
```css
background: var(--card);
backdrop-filter: blur(12px);
box-shadow: 0 12px 40px var(--ring), 0 0 0 1px rgba(255,255,255,0.5) inset;
border: 1px solid rgba(255,255,255,0.4);
border-radius: var(--r-lg);
```

---

## Firestore Collections

### `gardens`
```js
{ name, user: Reference, style: "mountain"|"tropical"|"lake", honoree: Reference, created }
```

### `honoree`
```js
{ first_name, last_name, dates, obit, obituary_url, created }
```

### `butterflies`
```js
{ gifter, message, garden: Reference, gardenId: string, color, created }
```

### `payments`
```js
{ uid, gardenId, color, gifter, message, amount: 99, currency: "usd", status: "pending"|"succeeded", createdAt, confirmedAt }
```

---

## Payment Flow

1. **Client** calls `createPaymentIntentFn({ gardenId, color, gifter, message })`
2. **Cloud Function** creates Stripe PaymentIntent ($0.99), writes pending record to Firestore, returns `clientSecret`
3. **Client** renders Stripe `PaymentElement` inside `<Elements>` with the `clientSecret`
4. **User** submits card → Stripe confirms payment client-side
5. **Client** calls `confirmPaymentFn({ paymentIntentId })`
6. **Cloud Function** verifies payment succeeded + UID matches, updates Firestore record
7. **Client** plays chrysalis hatch animation, then creates butterfly document

Payment methods are restricted to **card only** (`payment_method_types: ["card"]` in `functions/index.js`). Stripe Link is available as a built-in fast-checkout layer.

---

## Butterfly Asset System

Assets are auto-discovered via `import.meta.glob()` — no hardcoded lists.

### Adding a New Color
1. Create `src/assets/butterflies/{color}/` with `flying.gif` and `resting.gif`
2. Optionally add `src/assets/chrysalis/chrysalis-{color}.gif` for a color-matched hatch
3. That's it — the glob patterns pick it up automatically

### Current Colors
`blue`, `green`, `orange`, `pink`, `purple`, `yellow`

### Glob Patterns Used
```js
import.meta.glob('/src/assets/butterflies/*/resting.*', { eager: true })
import.meta.glob('/src/assets/butterflies/*/flying.*', { eager: true })
import.meta.glob('/src/assets/chrysalis/chrysalis-*.gif', { eager: true })
```

---

## Butterfly Physics (`useButterflyPhysics.js`)

requestAnimationFrame loop with 30Hz render / 60Hz physics update.

**Lifecycle**: Spawn from edge → fly (wander + bob) → land (5–30s) → take off → repeat. Off-screen butterflies wait 0–20s before respawning.

**Key tuning parameters**:
- `baseSpeed`: 0.8–1.6 px/frame
- `bobbingSpeed`: Vertical sine oscillation rate
- `landUntil`: 5,000–30,000ms rest duration
- `flutterBurst`: 1.6x speed for random bursts (300–600ms)
- `edgeMargin`: 120px soft boundary steering zone

Butterflies are frozen in place on hover (controlled by `frozenRef` Set in `garden.jsx`).

---

## Multi-Step Wizard Pattern

Both the creation page and buy panel use the same pattern:

```jsx
const [step, setStep] = useState(1);
const [dir, setDir] = useState('forward');

const next = () => { setDir('forward'); setStep(s => Math.min(MAX, s + 1)); };
const back = () => { setDir('back'); setStep(s => Math.max(1, s - 1)); };

// In JSX:
<div className="step-viewport">
  {step === 1 && (
    <div className={`step-panel ${dir === 'forward' ? 'slide-forward' : 'slide-back'}`}>
      {/* step content */}
    </div>
  )}
</div>
```

Step indicator uses the `.eyebrow` class: `<span className="eyebrow">Step 1 of 3</span>`

---

## Common Patterns

### Panel / Modal
```jsx
<Panel open={bool} onClose={handler} title="Optional title" stepLabel="Step 1 of 3">
  {children}
</Panel>
```
Panel is defined locally in `GardenControls.jsx`. Uses `.panel-root`, `.panel-backdrop`, `.hero-card.panel-sheet` classes.

### Auth Gate
```jsx
const { user, isAuthenticated } = useAuth();
if (!isAuthenticated) { /* show AuthPopup or redirect */ }
```

### Firestore Reads
- One-time: `getDocs(collection(db, 'collectionName'))`
- Real-time: `onSnapshot(query(...), callback)` — used in garden view for live butterfly updates

---

## Development Notes

- **Firebase emulator** auto-connects in dev mode (`src/firebase.js` checks `location.hostname` for `localhost`/`127.0.0.1`)
- **Stripe test card**: `4242 4242 4242 4242`, any future expiry, any CVC
- **No TypeScript** — pure JSX throughout, though type packages are installed
- **No state library** — React Context for auth, local useState for everything else
- **No CSS modules** — single global stylesheet + co-located component CSS for Header/AuthPopup
- The chunk size warning during build is expected (large video assets)

---

## Deployment

```bash
npm run build                          # Build frontend
firebase deploy                        # Deploy everything
firebase deploy --only hosting         # Frontend only
firebase deploy --only functions       # Cloud functions only
```

Stripe secret key must be set as a Firebase secret:
```bash
firebase functions:secrets:set STRIPE_SECRET_KEY
```

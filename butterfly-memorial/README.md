# Butterfly Memorial

A memorial garden web app where visitors release butterflies carrying messages for loved ones. Each butterfly is purchased for $0.99 via Stripe and flies in a shared, physics-driven garden.

## Prerequisites

- **Node.js 20+**
- **Firebase CLI** — `npm install -g firebase-tools`
- **Firebase project** — access to the `butterfly-memorial` project (or your own)
- **Stripe account** — test mode keys for local development

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd butterfly-memorial
npm install
cd functions && npm install && cd ..
```

### 2. Environment variables

Create `.env.local` in the project root:

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
```

### 3. Stripe secret key (for Cloud Functions)

```bash
firebase functions:secrets:set STRIPE_SECRET_KEY
# Paste your sk_test_... key when prompted
```

For local emulator testing, create `functions/.secret.local`:

```
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
```

## Development

### Frontend only (no payments)

```bash
npm run dev
```

Runs at `http://localhost:5173`. You can browse gardens and create them, but the payment flow requires the functions emulator.

### Full stack (with payments)

Terminal 1 — Firebase emulator:

```bash
firebase emulators:start --only functions
```

Terminal 2 — Vite dev server:

```bash
npm run dev
```

The app auto-connects to the local functions emulator when running on `localhost`.

### Test payments

Use Stripe's test card: `4242 4242 4242 4242`, any future expiry date, any 3-digit CVC.

## Build & Deploy

```bash
npm run build                          # Build frontend to dist/
firebase deploy                        # Deploy hosting + functions
firebase deploy --only hosting         # Frontend only
firebase deploy --only functions       # Cloud functions only
```

## Project Structure

```
src/
  pages/
    LandingPage.jsx        Homepage with search
    create.jsx             4-step garden creation wizard
    garden.jsx             Full-screen interactive garden
    Profile.jsx            User's garden list
    spirit-butterfly.css   Master stylesheet & design tokens
  components/
    GardenControls.jsx     3-step buy wizard + butterfly list
    CheckoutForm.jsx       Stripe payment form
    FlyingButterfly.jsx    Butterfly renderer
    PageLayout.jsx         Layout with ambient butterflies
    VideoBackground.jsx    Lazy-loaded backgrounds
    Header.jsx             Nav bar
    AuthPopup.jsx          Auth modal
  hooks/
    useButterflyPhysics.js Physics simulation engine
  contexts/
    AuthContext.jsx         Firebase auth provider
  assets/
    butterflies/{color}/   flying.gif + resting.gif per color
    chrysalis/             Color-matched hatch animations
    backgrounds/           Video + image backgrounds
functions/
  index.js                 createPaymentIntent, confirmPayment
```

## Adding a New Butterfly Color

1. Create `src/assets/butterflies/{color}/` with `flying.gif` and `resting.gif`
2. Optionally add `src/assets/chrysalis/chrysalis-{color}.gif`
3. Done — assets are auto-discovered via `import.meta.glob()`

## Tech Stack

- **React 19** + **Vite 7** — frontend
- **Firebase** — Auth, Firestore, Hosting, Cloud Functions
- **Stripe** — payment processing (card only)
- **Playfair Display** + **Inter** — typography

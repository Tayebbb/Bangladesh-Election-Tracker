# Bangladesh Live Election Tracker 🗳️

Real-time election results and seat counting for Bangladesh parliamentary elections.
Built with Next.js, Firebase, Leaflet, and Tailwind CSS.

## Features

- **Live Dashboard** — Total seats per party, popular vote %, real-time updates
- **Interactive Map** — Leaflet + OpenStreetMap with constituency-level coloring
- **Constituency Drill-down** — Candidate list, vote breakdown, margins, turnout
- **Admin Panel** — Division → District → Constituency cascade selector with MCQ-style vote entry
- **Real-time** — Firestore `onSnapshot` listeners push updates instantly
- **Lightweight** — Lazy-loaded map, minimal dependencies, optimized bundles

## Tech Stack

| Layer      | Technology                      |
|------------|----------------------------------|
| Frontend   | Next.js 14 (App Router), React 18 |
| Styling    | Tailwind CSS                     |
| Map        | Leaflet + react-leaflet          |
| Backend    | Firebase Firestore               |
| Auth       | Firebase Authentication          |
| Hosting    | Vercel                           |
| Analytics  | Cloudflare Web Analytics         |

## Quick Start

### 1. Clone & Install

```bash
git clone <repo-url>
cd bangladesh-election-tracker
npm install
```

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/) → Create project
2. Enable **Firestore Database** (production mode)
3. Enable **Authentication** → Email/Password
4. Go to Project Settings → General → copy config values
5. Deploy Firestore rules:

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules
```

**Note:** The admin panel is accessible only via the secret URL `/admin9012` (not visible in navigation).

### 3. Create Admin User

1. In Firebase Auth console, create a user (email + password)
2. Note the user UID
3. In Firestore, create document: `adminUsers/{uid}`
   ```json
   {
     "email": "admin@example.com",
     "displayName": "Admin",
     "role": "admin",
     "createdAt": "2026-01-01T00:00:00Z"
   }
   ```

### 4. Environment Variables

```bash
cp .env.example .env.local
# Edit .env.local with your Firebase config values
```

### 5. Run Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Routes:**
- `/` — Dashboard  
- `/map` — Full map
- `/admin9012` — Admin panel (hidden from navigation)
- `/constituency/[id]` — Details

## Deployment

### Vercel

1. Push to GitHub
2. Import in [Vercel](https://vercel.com)
3. Add all `NEXT_PUBLIC_*` env vars from `.env.example`
4. Deploy

### Cloudflare Analytics

1. Go to [Cloudflare Web Analytics](https://dash.cloudflare.com/?to=/:account/web-analytics)
2. Add your domain → get beacon token
3. Update token in `app/layout.tsx` or set `NEXT_PUBLIC_CF_ANALYTICS_TOKEN`

## Project Structure

```
app/
  page.tsx              → Main dashboard
  map/page.tsx          → Full interactive map
  constituency/[id]/    → Constituency detail
  admin9012/page.tsx    → Admin result entry (secret route)
  layout.tsx            → Root layout + analytics
  globals.css           → Global styles

components/
  Header.tsx            → Navigation
  ResultsSummary.tsx     → Metrics + seat counter
  SeatCounter.tsx        → Party seat bar
  VoteBar.tsx           → Vote breakdown bars
  MapView.tsx           → Leaflet map
  ConstituencyList.tsx  → Searchable constituency list
  AdminLogin.tsx        → Auth form
  AdminPanel.tsx        → Vote entry form
  LoadingSpinner.tsx    → Loading states

lib/
  firebase.ts           → Firebase init (singleton)
  firestore.ts          → All Firestore CRUD + listeners
  auth.ts               → Auth helpers
  constants.ts          → App constants
  utils.ts              → Formatting utilities

hooks/
  useAuth.ts            → Auth state hook
  useElectionData.ts    → Real-time data hooks

data/
  parties.ts            → Party definitions
  divisions.ts          → Division/District/Constituency hierarchy

types/
  index.ts              → TypeScript types

public/data/geojson/    → Map boundary + district data
```

## Firestore Collections

| Collection       | Purpose                        |
|------------------|--------------------------------|
| `parties`        | Party metadata                 |
| `constituencies` | 300 constituency records       |
| `candidates`     | Candidate per constituency     |
| `results`        | Vote tallies (keyed by constituency ID) |
| `summary`        | Aggregated seat counts         |
| `adminUsers`     | Admin access control           |

## GeoJSON

Replace placeholder files in `public/data/geojson/` with real Bangladesh constituency boundaries for production.
Recommended source: [GADM](https://gadm.org/download_country.html) or Bangladesh Election Commission.

## Performance Notes

- Map is lazy-loaded via `next/dynamic` (not in initial bundle)
- Firestore listeners provide real-time updates without polling
- Static party/division data avoids unnecessary reads
- `preferCanvas: true` on Leaflet for better rendering of many features
- Summary document is pre-aggregated to avoid client-side computation

## License

MIT


## Vibe Market — MVP + Polish Build Plan

A marketplace for developers to buy and sell vibe-coded projects, prototypes, and templates. Playful, bold design with full transaction support via Stripe.

---

### 1. Design System & Landing Page
- Bold, colorful design with vibrant gradients and expressive typography
- Hero section with tagline, CTA to browse or sell, and a live count of listings
- Navigation with Browse, Sell, and Sign In / Dashboard links
- Footer with links to ToS, DMCA policy notice

---

### 2. User Accounts (Buyers & Sellers)
- Sign up / log in with email + password (Supabase Auth)
- A single account can act as both buyer and seller
- Basic profile page showing listings created and purchases made

---

### 3. Project Listing Creation (Seller Flow)
- Multi-step listing form:
  - **Title, description, price** (with a minimum of $1)
  - **Completeness badge** picker: Prototype / MVP / Production-Ready
  - **Tech stack tags** (e.g. React, Supabase, Tailwind, Python)
  - **Category** (SaaS Tool, AI App, Landing Page, Utility, Game, Other)
  - **File delivery**: upload a ZIP file OR paste a GitHub repo URL (or both)
  - **Screenshots** (up to 5 images) and optional demo URL
- Listings start in "pending review" state before going live (basic moderation)

---

### 4. Browse & Discovery
- Grid-based marketplace homepage with listing cards showing:
  - Screenshot thumbnail, title, price, completeness badge, tech stack tags
- Filter sidebar: category, completeness level, price range, tech stack
- Search bar with keyword search across titles and descriptions
- "Newest" and "Popular" sort options

---

### 5. Listing Detail Page
- Full description, all screenshots (gallery view)
- Completeness badge with tooltip explaining what each level means
- Tech stack tag chips and demo link button
- Seller info (username, total sales)
- Buy Now button with price
- Reviews section (visible after purchase flow exists)

---

### 6. Purchase & Download (Buyer Flow)
- Stripe Checkout for one-time payments
- Platform takes 20% fee, seller receives 80% (via Stripe Connect)
- After successful payment: instant access to download ZIP or view GitHub link
- Purchase history on the buyer's profile

---

### 7. Seller Dashboard
- Overview: total earnings, number of sales, active listings
- List of all listings with status (pending / live / hidden) and edit option
- Sales history table (date, buyer, listing, amount received)
- Stripe Connect onboarding to set up payouts

---

### 8. Post-Purchase Reviews
- Buyers can leave a 1–5 star rating and short text review after purchasing
- Reviews displayed on the listing page with average star rating shown on cards

---

### Pages / Routes
- `/` — Landing / Browse marketplace
- `/listing/:id` — Listing detail page
- `/sell` — Create new listing (auth required)
- `/dashboard` — Seller dashboard (auth required)
- `/profile` — Buyer's purchase history
- `/login` & `/signup` — Auth pages
- `/success` — Post-purchase confirmation & download page


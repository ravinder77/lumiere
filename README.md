# LUMIÈRE — Full-Stack Ecommerce Application

A production-ready ecommerce platform with authentication, wishlist, reviews, order tracking, and an admin dashboard.

## Tech Stack

| Layer    | Technology                                                         |
|----------|--------------------------------------------------------------------|
| Frontend | React 19 · TypeScript · Vite 6 · Tailwind CSS 3                    |
| State    | Zustand (cart, auth, wishlist — all persisted) · TanStack Query v5 |
| Routing  | React Router v7                                                    |
| Backend  | Node.js · Express 5 · TypeScript                                   |
| Database | PostgreSQL · Prisma ORM                                            |
| Auth     | JWT (access 15m + refresh 7d) · bcrypt · auto-refresh interceptor  |
| Security | Helmet · CORS · express-rate-limit · Zod validation                |

---

## Project Structure

```
ecommerce/
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── App.tsx                Client bootstrap + providers
│       │   ├── hooks/
│       │   │   └── useAppBootstrap.ts Session bootstrap using React 19 effects
│       │   ├── providers/
│       │   │   └── AppProviders.tsx   Query + toast providers
│       │   └── router/
│       │       └── AppRouter.tsx      Route tree and guarded layouts
│       ├── components/
│   │   ├── Navbar.tsx            Sticky navbar, user dropdown, wishlist badge
│   │   ├── CartDrawer.tsx        Slide-over cart with quantity controls
│   │   ├── ProductCard.tsx       Grid card, quick-add, persistent wishlist toggle
│   │   ├── ReviewsSection.tsx    Review list, star rating, submit/edit/delete form
│   │   ├── StarRating.tsx        Reusable interactive/display star component
│   │   ├── Skeletons.tsx         ProductCard, ProductDetail, Review, TableRow skeletons
│   │   ├── ProtectedRoute.tsx    Auth guard (supports adminOnly prop)
│   │   ├── ErrorBoundary.tsx     React error boundary with retry button
│   │   └── Footer.tsx            Real links, functional newsletter form
│   ├── pages/
│   │   ├── HomePage.tsx          Hero, featured products, category grid, editorial
│   │   ├── ProductsPage.tsx      Search, filter, sort, pagination
│   │   ├── ProductDetailPage.tsx Gallery, wishlist, add to cart, reviews section
│   │   ├── CheckoutPage.tsx      Multi-step, auth pre-fill, real card input fields
│   │   ├── LoginPage.tsx         Split layout, demo credential hints
│   │   ├── RegisterPage.tsx      Live password strength meter
│   │   ├── AccountPage.tsx       Profile / Order history / Change password tabs
│   │   ├── WishlistPage.tsx      Saved products grid with add-to-cart
│   │   ├── OrderTrackingPage.tsx Search any order ID, visual progress tracker
│   │   ├── AdminPage.tsx         Stats dashboard, orders management, users table
│   │   └── NotFoundPage.tsx      404 with navigation options
│       ├── shared/
│       │   ├── lib/
│       │   │   ├── cn.ts              Local className helper
│       │   │   ├── http.ts            Fetch client with token refresh
│       │   │   └── session.ts         Token persistence helpers
│       │   └── ui/
│       │       └── toast/
│       │           └── toast-api.tsx  Internal toast API replacing package
│       ├── store/
│   │   ├── authStore.ts          Zustand auth (persisted, auto-hydrated)
│   │   ├── cartStore.ts          Zustand cart (persisted, server-synced)
│   │   └── wishlistStore.ts      Zustand wishlist (server-synced, optimistic)
│       └── lib/
│       ├── authApi.ts            Fetch client + silent token refresh
│       ├── api.ts                Products / cart / orders API
│       └── extraApi.ts           Wishlist / reviews / admin API
│
└── backend/
    └── src/
        ├── app/
        │   └── createApp.ts          Express bootstrap and middleware
        ├── routes/
    │   ├── auth.ts               register · login · refresh · /me · profile · change-password · user orders
    │   ├── products.ts           List (filter/search/sort/paginate) · detail · featured · categories
    │   ├── cart.ts               Create · get · add · update qty · remove · clear
    │   ├── orders.ts             Place · get by ID · list mine (auth)
    │   ├── wishlist.ts           List · add · remove · /ids (lightweight)
    │   ├── reviews.ts            List with stats · submit · edit · delete
    │   └── admin.ts              Stats · all orders + status update · all users
        ├── middleware/
    │   └── auth.ts               authenticate · optionalAuth · requireAdmin
        ├── lib/
    │   ├── prisma.ts             Singleton Prisma client
    │   └── jwt.ts                Sign/verify access + refresh tokens
        ├── validators/
    │   └── auth.ts               Zod schemas (register, login, profile, password)
        ├── prisma/
    │   └── seed.ts               Seeds admin + demo user
        └── index.ts               Server entrypoint
```

---

## Quick Start

### Prerequisites
- **Node.js 18+**
- **PostgreSQL** (local, Supabase, Neon, Railway, etc.)

### 1. Install

```bash
cd frontend && npm install
cd ../backend && npm install
```

### 2. Configure environment

Edit `backend/.env`:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/lumiere_ecommerce"
JWT_ACCESS_SECRET="long-random-string-here"
JWT_REFRESH_SECRET="different-long-random-string"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
PORT=4000
NODE_ENV=development
```

### 3. Database setup

```bash
cd backend

# Preferred: Prisma migrations
npx prisma migrate dev --name init
npx prisma generate

# Alternative: run raw SQL
psql -U postgres -d lumiere_ecommerce -f prisma/migrations/001_init.sql

# Seed demo accounts
npm run db:seed
```

### 4. Start

```bash
# Terminal 1
cd backend
npm run dev   # http://localhost:4000

# Terminal 2
cd frontend
npm run dev   # http://localhost:5173
```

---

## Demo Credentials

| Role     | Email              | Password    |
|----------|--------------------|-------------|
| Customer | demo@lumiere.com   | Demo1234!   |
| Admin    | admin@lumiere.com  | Admin123!   |

Shown on the `/login` page for easy testing.

---

## Complete API Reference

### Auth — `/api/auth`

| Method | Path               | Auth?  | Description                            |
|--------|--------------------|--------|----------------------------------------|
| POST   | `/register`        | —      | Create account → returns tokens + user |
| POST   | `/login`           | —      | Login → returns tokens + user          |
| POST   | `/refresh`         | —      | Refresh access token                   |
| GET    | `/me`              | Bearer | Get current user                       |
| PATCH  | `/profile`         | Bearer | Update name or email                   |
| POST   | `/change-password` | Bearer | Change password                        |
| GET    | `/orders`          | Bearer | Current user's order history           |

### Products — `/api/products`

| Method | Path          | Description                                                                     |
|--------|---------------|---------------------------------------------------------------------------------|
| GET    | `/`           | List with `category`, `search`, `sort`, `page`, `limit`, `minPrice`, `maxPrice` |
| GET    | `/featured`   | Featured products (up to 6)                                                     |
| GET    | `/categories` | Category list with item counts                                                  |
| GET    | `/:id`        | Product detail + related products                                               |

### Cart — `/api/cart`

| Method | Path                        | Description          |
|--------|-----------------------------|----------------------|
| POST   | `/`                         | Create new cart      |
| GET    | `/:cartId`                  | Get cart             |
| POST   | `/:cartId/items`            | Add item             |
| PATCH  | `/:cartId/items/:productId` | Update quantity      |
| DELETE | `/:cartId/items/:productId` | Remove item          |
| DELETE | `/:cartId`                  | Clear cart           |

### Orders — `/api/orders`

| Method | Path   | Auth?    | Description     |
|--------|--------|----------|-----------------|
| POST   | `/`    | Optional | Place order     |
| GET    | `/:id` | —        | Get order by ID |
| GET    | `/`    | Bearer   | My orders       |

### Wishlist — `/api/wishlist`  *(all require auth)*

| Method | Path          | Description                    |
|--------|---------------|--------------------------------|
| GET    | `/`           | Full wishlist with product data |
| GET    | `/ids`        | Lightweight — productId list   |
| POST   | `/`           | Add `{ productId }`            |
| DELETE | `/:productId` | Remove from wishlist            |

### Reviews — `/api/reviews`

| Method | Path          | Auth?  | Description                            |
|--------|---------------|--------|----------------------------------------|
| GET    | `/:productId` | —      | Reviews + stats (avg, distribution)    |
| POST   | `/:productId` | Bearer | Submit/update review                   |
| PATCH  | `/:productId` | Bearer | Edit own review                        |
| DELETE | `/:productId` | Bearer | Delete own review (Admin: any review)  |

### Admin — `/api/admin`  *(all require ADMIN role)*

| Method | Path                    | Description                     |
|--------|-------------------------|---------------------------------|
| GET    | `/stats`                | Revenue, orders, users, products|
| GET    | `/orders`               | All orders with user info       |
| PATCH  | `/orders/:id/status`    | Update order status             |
| GET    | `/users`                | All users                       |
| PATCH  | `/users/:id/role`       | Change user role                |

---

## Security Features

- **Rate limiting**: 300 req/15min globally, 20 req/15min on auth routes
- **Helmet**: Security headers on all responses
- **bcrypt**: Password hashing with cost factor 12
- **JWT**: Short-lived access tokens (15m) + long-lived refresh tokens (7d)
- **Zod**: Input validation on all auth endpoints
- **Timing-safe**: Login always hashes even on user-not-found to prevent timing attacks
- **Cascade deletes**: Wishlist + reviews deleted when user is deleted

---

## Extending

### Stripe checkout

The checkout flow now creates a Stripe Checkout Session at `POST /api/checkout/session`,
redirects the shopper to Stripe, and confirms the returned `session_id` back through
`GET /api/checkout/session/:sessionId`.

For webhook-driven status updates in local development:

```bash
stripe listen --forward-to localhost:4000/api/checkout/webhook
```

### Add email (Resend / Nodemailer)
Use for order confirmation, password reset tokens, and email verification.

### Deploy
- **Client**: Vercel / Netlify (`cd client && npm run build` → `client/dist/`)
- **Server**: Railway / Render / Fly.io (`cd server && npm run build` → `server/dist/`)
- **DB**: Supabase / Neon (free PostgreSQL tiers available)
# lumiere
# lumiere

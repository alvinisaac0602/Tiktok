# 🛍️ TikShop — Instant TikTok Commerce System

A full-stack TikTok-to-purchase commerce platform. Vendors sign up, upload products, generate creator links, and receive real-time orders with analytics — from TikTok click to delivery dispatch.

---

## 🚀 Full Feature Set

| Feature | Details |
|---|---|
| **Product pages** | Mobile-optimised with image carousel, stock counter, share/like |
| **Checkout** | Phone + location + optional GPS. Pay online (MTN/Airtel/Card) or Cash on Delivery |
| **Payments** | Flutterwave inline popup + immediate client-side confirmation + webhook backup |
| **Vendor portal** | Sign up → upload products → generate creator links → manage orders |
| **Real-time orders** | Supabase Realtime pushes new orders to vendor dashboard instantly |
| **Order management** | Status flow: pending → processing → dispatched. COD + Online tracked separately |
| **Creator links** | Vendor generates `?ref=creatorhandle` links — 5% commission auto-tracked |
| **Analytics** | Platform-wide funnel: link clicks → page views → checkouts → orders → paid → dispatched |
| **Admin panel** | Manage all orders, vendors, products, and view platform analytics |

---

## ⚡ Quick Start — Run Locally

```bash
cd "c:\Users\user\Desktop\Tiktok"
npm install
npm run dev
```

Open: **http://localhost:5173**

- Customer demo: `http://localhost:5173/p/demo`
- Vendor portal: `http://localhost:5173/vendor/login`

---

## 🗄️ Supabase Setup (One-Time)

### Step 1 — Run the base schema

1. Go to your [Supabase project](https://supabase.com/dashboard) → **SQL Editor**
2. Copy and paste the entire contents of **`supabase/schema.sql`**
3. Click **Run**

### Step 2 — Run the analytics + COD migration

4. In the same SQL Editor, paste the contents of **`supabase/migrations/001_analytics_cod.sql`**
5. Click **Run**

### Step 3 — Enable Realtime

6. Go to **Database → Replication**
7. Ensure `orders`, `payments`, and `analytics_events` tables are in the `supabase_realtime` publication (the SQL already does this, just verify)

---

## 💳 Flutterwave Setup

### Test mode (development)
Your `.env` already has a test key — it works as-is. Use Flutterwave's test credentials:
- **Test card:** `4187427415564246` | CVV: `828` | Exp: `09/32`
- **Test MTN mobile money:** Use any 10-digit number when prompted

### Go live (production)
1. Replace `VITE_FLW_PUBLIC_KEY` in `.env` with your live key from [Flutterwave Dashboard](https://dashboard.flutterwave.com)
2. Replace `VITE_APP_URL` with your production domain

### Webhook (payment server-side confirmation)

The Edge Function at `supabase/functions/flw-webhook/index.ts` handles server-side payment verification as a backup to client-side confirmation.

**Deploy the webhook:**
```bash
# Install Supabase CLI if needed
npm install -g supabase

# Login and link project
supabase login
supabase link --project-ref rngvildhoutwlnfejclw

# Set required secrets
supabase secrets set FLW_SECRET_HASH=your_flutterwave_secret_hash

# Deploy the function
supabase functions deploy flw-webhook
```

**Get the webhook URL:**
```
https://rngvildhoutwlnfejclw.supabase.co/functions/v1/flw-webhook
```

**Configure in Flutterwave:**
1. Go to Flutterwave Dashboard → Settings → Webhooks
2. Add the URL above
3. Set the Secret Hash (same value as `FLW_SECRET_HASH`)

---

## 👥 User Flows

### Vendor Onboarding Flow

```
Admin sends signup link → /vendor/login
    ↓
Vendor clicks "Create Account"
    ↓
Fills: Store Name, Email, Password, Phone/WhatsApp
    ↓
Vendor dashboard loads → Go to Products
    ↓
Vendor adds products (title, price, stock, images)
    ↓
For each product: click "Generate Creator Link"
    ↓
Enter TikTok creator's handle (e.g. @content_creator)
    ↓
Shareable link generated:
  https://yourdomain.com/p/{productId}?ref=content_creator
    ↓
Copy link → paste into TikTok video description / bio
```

### Customer Purchase Flow (Online)

```
Customer sees TikTok video → clicks link in description
    ↓ (Analytics: link_click + page_view tracked)
Product page loads — mobile optimised with Buy Now button
    ↓
Customer clicks Buy Now → Checkout page
    ↓ (Analytics: checkout_start tracked)
Customer fills: name (optional), phone, delivery zone, landmark
    ↓
Selects "Pay Online" → clicks "Pay Now"
    ↓
Flutterwave popup → MTN / Airtel / Card payment
    ↓ (Analytics: order_placed + payment_success tracked)
Order immediately confirmed in Supabase (status: paid)
    ↓
Vendor dashboard receives real-time alert 🎉
    ↓
Confirmation page shown to customer
```

### Customer Purchase Flow (Cash on Delivery)

```
Customer selects "Pay on Delivery" at checkout
    ↓
Clicks "Place Order (Pay on Delivery)"
    ↓ (Analytics: order_placed tracked)
Order created (status: pending_cod)
    ↓
Vendor sees order in dashboard with 🚚 COD badge
    ↓
Vendor calls customer to confirm → marks "Processing"
    ↓
Vendor delivers → marks "Dispatched"
    ↓ (5% creator commission auto-recorded)
```

### Admin Analytics Flow

```
Admin → Logs in → Admin Panel (/admin)
    ↓
Clicks "Platform Analytics" button
    ↓
Funnel shows: Clicks → Views → Checkouts → Orders → Paid → Dispatched (across all stores)
    ↓
Vendor ranking: which stores perform best?
    ↓
Creator leaderboard: who drives the most referred traffic?
```

---

## 📁 Project Structure

```
src/
├── lib/
│   ├── supabase.js          # Supabase client
│   ├── flutterwave.js       # Flutterwave payment helper
│   └── analytics.js         # Funnel event tracker
├── hooks/
│   └── useRealtimeOrders.js # Realtime orders + vendor auth hooks
├── pages/
│   ├── ProductPage.jsx      # Customer product page (TikTok link destination)
│   ├── CheckoutPage.jsx     # Checkout (online + COD)
│   ├── ConfirmPage.jsx      # Order confirmation
│   ├── VendorLogin.jsx      # Vendor signup/login
│   ├── VendorDashboard.jsx  # Real-time orders dashboard
│   ├── VendorProducts.jsx   # Product management + link generator
│   ├── AdminAnalytics.jsx   # Platform-wide funnel analytics (admin-only)
│   └── AdminPanel.jsx       # Platform admin view
├── components/
│   ├── Navbar.jsx
│   └── UI.jsx               # Shared components
supabase/
├── schema.sql               # Base schema (run first)
├── migrations/
│   └── 001_analytics_cod.sql # COD + analytics migration (run second)
└── functions/
    └── flw-webhook/         # Flutterwave payment webhook
        └── index.ts
```

---

## 🔑 Environment Variables

File: `.env`

```env
# Supabase
VITE_SUPABASE_URL=https://rngvildhoutwlnfejclw.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Flutterwave (use FLWPUBK_TEST-... for sandbox, FLWPUBK-... for live)
VITE_FLW_PUBLIC_KEY=FLWPUBK_TEST-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-X

# Your app URL (used for payment branding)
VITE_APP_URL=http://localhost:5173
```

---

## 🗃️ Database Tables

| Table | Purpose |
|---|---|
| `users` | Auth mirror (auto-created on signup) |
| `vendors` | Vendor store profiles (name, slug, phone, WhatsApp) |
| `products` | Product catalogue (title, price, images, stock) |
| `orders` | Orders with status flow + payment method (online/cod) |
| `payments` | Flutterwave payment records |
| `commissions` | 5% creator commission auto-tracked on paid/dispatched |
| `analytics_events` | Funnel events (link_click, page_view, checkout_start, order_placed, payment_success, dispatched) |

### Order Status Flow

```
pending_payment → paid (online, confirmed by Flutterwave)
pending_cod     → processing → dispatched (COD flow)
any             → cancelled
any             → failed (payment failed)
```

---

## 🚢 Deploy to Vercel

```bash
npm run build
# Then push to GitHub and connect to Vercel
# Add all VITE_ env vars in Vercel project settings
```

The `vercel.json` file already handles SPA routing.

---

## 📞 Support

- Supabase issues → check RLS policies in `schema.sql`
- Payment issues → verify `VITE_FLW_PUBLIC_KEY` in `.env`
- Realtime not working → check Supabase Replication settings
http://localhost:5173/admin/login
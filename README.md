# 🛍️ TikShop — Instant TikTok Commerce Checkout System

A real-time social commerce payment + order routing engine for TikTok sellers in Uganda.

> Converts TikTok impulse traffic into paid vendor orders in under 60 seconds. Zero friction. No customer accounts required.

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy env file and fill in your keys
cp .env.example .env

# 3. Run Supabase schema
# → Open supabase/schema.sql in Supabase SQL Editor and run it

# 4. Start dev server
npm run dev
```

---

## ⚙️ Environment Variables

Fill in `.env` with your real values:

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key |
| `VITE_FLW_PUBLIC_KEY` | Your Flutterwave public key |
| `VITE_APP_URL` | Your deployed frontend URL |

---

## 📂 Project Structure

```
src/
├── components/
│   ├── Navbar.jsx          # Top nav with vendor auth state
│   └── UI.jsx              # Badges, spinners, stat cards, toasts
├── hooks/
│   └── useRealtimeOrders.js # Supabase realtime + vendor auth hooks
├── lib/
│   ├── supabase.js         # Supabase client + auth helpers
│   └── flutterwave.js      # FLW inline payment + UGX formatter
├── pages/
│   ├── ProductPage.jsx     # /p/:productId?ref=creator
│   ├── CheckoutPage.jsx    # /checkout/:productId
│   ├── ConfirmPage.jsx     # /confirm/:orderId
│   ├── VendorLogin.jsx     # /vendor/login
│   ├── VendorDashboard.jsx # /vendor/dashboard  (realtime orders)
│   ├── VendorProducts.jsx  # /vendor/products   (product management)
│   └── AdminPanel.jsx      # /admin
supabase/
├── schema.sql              # Full DB schema + RLS + triggers
└── functions/
    └── flw-webhook/
        └── index.ts        # Edge Function for payment webhook
```

---

## 🔗 Core User Flows

### Customer Flow
```
TikTok video
  → /p/:productId?ref=creator123
  → /checkout/:productId
  → Flutterwave payment popup (MTN / Airtel / Card)
  → /confirm/:orderId
```

### Vendor Flow
```
/vendor/login
  → /vendor/dashboard  (real-time orders)
  → /vendor/products   (manage listings)
```

### Creator Attribution
Every product link supports `?ref=creator123`.  
Creator is stored on each order and auto-generates a commission record when payment is confirmed.

---

## 💳 Flutterwave Setup

1. Create account at [flutterwave.com](https://flutterwave.com)
2. Get your **Public Key** → paste in `.env` as `VITE_FLW_PUBLIC_KEY`
3. Set up webhook in FLW dashboard:
   - URL: `https://<your-project>.supabase.co/functions/v1/flw-webhook`
   - Events: `charge.completed`
4. Copy your **Secret Hash** from FLW → set as Supabase secret:
   ```bash
   supabase secrets set FLW_SECRET_HASH=your_hash_here
   ```
5. Deploy the Edge Function:
   ```bash
   supabase functions deploy flw-webhook
   ```

---

## 🗄️ Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Copy your **Project URL** and **Anon Key** → paste in `.env`
3. Open **SQL Editor** → run `supabase/schema.sql` fully
4. Enable **Realtime** for the `orders` table (already in schema)
5. Set **Service Role Key** as Supabase secret for the Edge Function:
   ```bash
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   supabase secrets set SUPABASE_URL=https://your-project.supabase.co
   ```

---

## 🎨 Routes Reference

| Route | Who | Description |
|---|---|---|
| `/p/:productId` | Customer | Product page |
| `/p/:productId?ref=creator` | Customer | Product with creator attribution |
| `/checkout/:productId` | Customer | Checkout form |
| `/confirm/:orderId` | Customer | Order confirmation |
| `/vendor/login` | Vendor | Login / Register |
| `/vendor/dashboard` | Vendor | Real-time orders |
| `/vendor/products` | Vendor | Manage products |
| `/admin` | Admin | System overview |

---

## 🔐 Security

- **RLS** enforced on all tables — vendors only see their own orders/products
- **Webhook signature** verified via `verif-hash` header
- **Service role key** only used server-side in Edge Function (never exposed to client)
- **No customer accounts** required — phone number is the identifier

---

## 🌍 Deployment

### Frontend → Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```
Set all `VITE_*` env vars in your Vercel project settings.

### Backend → Supabase (already hosted)
```bash
# Deploy Edge Function
supabase functions deploy flw-webhook --project-ref your-project-ref
```

---

## 📱 Demo

Visit `http://localhost:5173/p/demo` to see the product page with a demo product (no Supabase needed).

Visit `http://localhost:5173/vendor/login` to test the vendor auth flow.

---

## 🧪 Test Credentials (Flutterwave Sandbox)

| Method | Number | OTP |
|---|---|---|
| MTN Uganda | 256772000000 | 12345 |
| Airtel Uganda | 256700000000 | 12345 |

Use test public key starting with `FLWPUBK_TEST-...`

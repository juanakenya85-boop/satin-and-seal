# Satin & Seal — MVP Scaffold

A working full-stack scaffold for the discreet online shop: **Flask + MySQL** backend,
**React (Vite)** frontend. Implements every screen we mocked up — landing (with
a blog/journal section), shop with Top Selling / New Arrivals rails, product
detail with reviews, signup/login with age verification, cart, checkout with
Nairobi/outside-Nairobi delivery pricing, account dashboard, and a real admin
panel with image upload, order management, review moderation, and notifications.

This is a **real, runnable MVP** — not a static mockup. Product data lives in MySQL,
auth uses JWTs, product photos are real uploaded files, and cart/checkout/stock all
talk to the database.

**This version ships with no placeholder data.** `seed.py` only creates database
tables, the five structural categories, one real admin account (from your `.env`),
and one seed blog post. Every product and every real customer account, you add
yourself through the actual app — which is the point of this being a real test
rather than a demo.

---

## 1. Prerequisites

- Python 3.10+
- Node.js 18+
- MySQL 8+ running locally (or a cloud instance)

---

## 2. Backend setup (Flask + MySQL)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create the database in MySQL:

```sql
CREATE DATABASE satin_and_seal CHARACTER SET utf8mb4;
```

**Your `.env` is already filled in** with the database credentials you gave us —
you don't need to copy `.env.example` or re-enter `DATABASE_URL` /
`JWT_SECRET_KEY` again. It's listed in `.gitignore`, so as long as you don't
delete or overwrite it, future code updates won't touch it.

Open `backend/.env` once to set your **real admin login**:

```
ADMIN_NAME=Your Name
ADMIN_EMAIL=you@yourdomain.co.ke
ADMIN_PASSWORD=SomethingOnlyYouKnow
ADMIN_PHONE=0700000000
```

Then seed the database (creates tables, categories, your admin account, and one
blog post — no fake products or fake customers):

```bash
python seed.py
```

Run the API:

```bash
python run.py
```

API is now live at `http://localhost:5000/api`. Check `http://localhost:5000/api/health`.

**Re-running `seed.py` wipes and recreates the database** (`db.drop_all()`), so
only run it again if you genuinely want to reset everything — including any
real products or orders you've added since. For routine restarts, just run
`python run.py`, not `seed.py`.

### Password reset emails

Reset links work locally without any setup — if `SMTP_HOST` is blank in `.env`
(the default), the link just prints to your `python run.py` console instead of
being emailed, so you can test the flow immediately. To send real emails, fill
in `SMTP_HOST`, `SMTP_USERNAME`, `SMTP_PASSWORD`, and `SMTP_FROM_EMAIL` in
`.env` with a real provider's SMTP details (Gmail, SendGrid, Mailgun, etc.).

### SasaPay payments

**Credentials are not set in `.env`** — you enter them from the **Settings tab**
in `/admin` instead, so you (or whoever runs the store) can wire up payments
without touching code. Get your Client ID, Client Secret, and Merchant Code
from [docs.sasapay.app](https://docs.sasapay.app), paste them into Settings,
toggle "Enable SasaPay checkout" on, and hit **Save & Test Connection** — it
authenticates against SasaPay's servers before saving anything, so a typo
shows an error instead of silently breaking checkout later.

One thing that *does* need a `.env` value: `APP_BASE_URL`. This is the public
URL SasaPay's servers call back to once a payment resolves — `localhost` won't
work, since SasaPay can't reach your machine directly. For local testing, run
a tunnel (e.g. `ngrok http 5000`) and put its `https://...` URL in
`APP_BASE_URL`. In production, this is just your real backend domain.

If SasaPay isn't enabled (or a request to it fails), checkout still works —
the order is saved with `payment_status: "manual"` and the customer sees a
message that you'll follow up on payment directly. Nothing blocks the order
from being placed.

---

## 3. Frontend setup (React + Vite)

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

App is live at `http://localhost:5173`. The Vite dev server proxies `/api/*` and
`/uploads/*` requests to the Flask backend automatically (see `vite.config.js`).

---

## 4. Doing a real test

1. Go to `http://localhost:5173/login`, log in with the admin email/password you
   set in `.env`. You'll land on `/admin` — the owner never sees the customer
   shopping view (see "Design notes" below).
2. On the **Products** tab, click **Add Product**: upload a real photo, write a
   real description, set a real price and quantity, pick a category, publish.
3. Open an incognito window (or log out), go to `/login`, and sign up as a real
   customer — the 18+ checkbox is enforced, so you can't skip it.
4. Browse the shop, open the product you just added, leave a review (it goes
   into the pending queue), add it to cart, check out with a real Nairobi or
   outside-Nairobi address.
5. Back in the admin tab: the **notification bell** should show a new
   "New order #1 placed by..." notification. The **Orders** tab shows the order;
   move its status through Confirmed → Packed → Out for Delivery → Delivered —
   the customer's Account page tracker updates to match.
6. The **Reviews** tab shows the pending review from step 4 — approve or reject
   it. Once approved, it appears publicly on the product page.
7. In the **Settings** tab, paste in your SasaPay sandbox credentials and hit
   **Save & Test Connection**. If they're valid, it flips to "Connected." Place
   another test order with M-Pesa selected — checkout now sends a real request
   to SasaPay (you'll need `APP_BASE_URL` reachable from the internet for the
   callback to complete — see the SasaPay section above).
8. Log out, click **Forgot password?** on the login screen, and submit your
   email. If you haven't set up SMTP, the reset link prints straight to your
   `python run.py` console — copy it into the browser to finish the flow.
9. As the customer, click the heart icon on a product card to save it, then
   check `/wishlist` — it should be there with an add-to-cart button.
10. Back as admin, go to **Settings** and change the delivery rates to
    something else. Reload the landing page and cart — the new numbers show
    up everywhere without touching any code.
11. In the **Riders** tab, add a rider account. Log in as that rider (a
    different browser/incognito window) — you should land on a bare-bones
    "My Deliveries" page with no shop, no cart, and no way to see product
    details. Back as admin, assign your test order to that rider from the
    Orders tab's rider dropdown, then log back in as the rider and confirm
    the order appears with delivery details but **no product names or
    prices** — that's intentional.

---

## 5. What's implemented

**Customer flow:**
- Landing page with category shortcuts and a Journal/blog section
- Sign up (18+ age confirmation) / log in
- Shop — category filters, sort, Top Selling rail, New Arrivals rail, full grid
- Product detail page — real photo, description, quantity picker, star rating,
  approved reviews, and a review submission form (goes to moderation queue)
- Cart — live delivery fee, read from the database (**Admin > Settings** controls
  the actual numbers, not a hardcoded value in the code)
- Checkout — address form, M-Pesa (real SasaPay request), Card (placeholder —
  see note below), or Cash on Delivery
- Wishlist — save any product from its card (heart icon) or detail page; a
  dedicated `/wishlist` page lists everything saved, with one-tap add-to-cart
- Account dashboard — order history with a live status tracker and payment
  status (Paid / Pending / Needs follow-up / Failed)
- Forgot/reset password — self-service, no admin involvement needed
- Blog/Journal — reads real posts from the database, with a `/journal` listing
  page (linked from the navbar) and individual `/journal/:slug` post pages

**Rider flow (`/rider` — a third role alongside customer and admin):**
- Riders log in and land on a stripped-down "My Deliveries" dashboard — no
  shop, no cart, no product catalog
- They see only orders **assigned to them**, and even then only what they need
  to complete a delivery: customer name, phone, address, delivery notes, item
  *count*, and the cash amount to collect if it's a COD order — never product
  names, categories, or prices. That's deliberate: discretion applies
  internally too, not just to the customer facing outward.
- Riders update their own deliveries through Out for Delivery → Delivered, or
  flag "Couldn't Deliver" if the customer's unreachable

**Admin flow (`/admin` — owner-only, customer pages are hidden and unreachable):**
- Dashboard stats: total income, total orders, total customers, pending reviews,
  product counts by stock status, products-by-category breakdown, payment-method
  breakdown, and a "Riders: 0 · v2" placeholder for the upcoming rider role
- **Notification bell** — fires on new orders and completed deliveries, polls
  every 20 seconds, click to mark all as read
- Products tab — add/edit/delete, **real photo upload** (click to select,
  preview, stored on disk and served back to the app), auto-hide-when-out-of-stock
  logic
- Orders tab — every order with a status dropdown (Confirmed → Packed →
  Out for Delivery → Delivered → Delivery Failed), a payment status/method
  column, and a **rider-assignment dropdown** — assign any order to a rider
  right from the table
- Reviews tab — approve or reject pending reviews; only approved reviews are
  ever shown to customers
- Blog tab — write, edit, delete, and publish/unpublish posts, with a real
  cover-image upload, directly from the dashboard — no more editing the
  database by hand
- Riders tab — add a rider account (name, email, phone, temporary password),
  see how many active deliveries each one is carrying, remove a rider (any
  orders assigned to them are automatically unassigned, not deleted)
- Settings tab — two sections: **Delivery Rates** (the Nairobi/outside fees
  that drive the entire site's copy and checkout math) and **SasaPay**
  (payment credentials, tested against SasaPay's servers before saving)

**Not yet built (natural next steps):**
- Card payments — SasaPay doesn't process cards, so this checkout option is
  still a placeholder (see the Settings tab note about this)
- Email verification on signup (password reset is done; verifying a new
  account's email address on signup is not)
- Pagination on the product table/grid
- SasaPay is pointed at the **sandbox** API host — switching to production
  is a one-line change in `app/payments/sasapay.py` (`SASAPAY_BASE_URL`) once
  you have live credentials
- A rider's own login/password reset flow uses the same `/login` and
  `/forgot-password` pages as customers — works fine, just hasn't been
  visually distinguished (e.g. no "Rider Login" branding)

---

## 6. Project structure

```
backend/
  app/
    __init__.py         # Flask app factory, uploads folder, static file serving,
                         # public /api/delivery-rates
    extensions.py        # db, jwt, bcrypt, cors instances
    models.py             # User (incl. is_rider), Product, Category, Order (incl.
                           # assigned_rider_id + rider-redacted to_dict), Review,
                           # Notification, BlogPost, PaymentSettings, WishlistItem,
                           # DeliverySettings
    auth/routes.py        # register, login, me, forgot-password, reset-password
    products/routes.py    # list/detail (public), create/update/delete (admin),
                           # image upload, review submission + listing, wishlist
    cart/routes.py        # add/update/remove cart items
    orders/routes.py      # checkout (incl. SasaPay request + real delivery-rate
                           # lookup), order history, order-placed notification,
                           # sasapay-callback, rider assignment
    admin/routes.py       # stats, orders, order status, notifications, review
                           # moderation, SasaPay settings, rider management,
                           # delivery rate settings
    blog/routes.py        # public post listing/detail, admin post CRUD + cover upload
    rider/routes.py       # rider's own deliveries + status updates — always
                           # returns the redacted, no-product-info order view
    payments/sasapay.py   # SasaPay auth + request-payment API wrapper
    utils/email.py         # password-reset email sending (SMTP or console fallback)
  uploads/                # real product/blog photos land here (gitignored)
  seed.py                 # creates tables + categories + your real admin + blog
                           # posts + default delivery rates
  run.py                  # entry point
  requirements.txt
  .env                    # your real, filled-in local config (gitignored)
  .env.example            # template only — for reference or a fresh machine
  .gitignore

frontend/
  src/
    api/client.js         # single fetch wrapper for all API calls, incl. file
                           # upload, wishlist, rider, and admin settings endpoints
    context/AuthContext.jsx
    context/CartContext.jsx
    context/DeliveryContext.jsx  # fetches delivery rates once, shared app-wide
    components/Navbar.jsx  # role-aware: different nav/links for customer, admin,
                            # and rider accounts; avatar opens a dropdown menu
                            # rather than logging out on a single click
    components/ProductCard.jsx  # includes the wishlist heart-toggle button
    pages/Landing.jsx      # hero, categories, journal/blog section — delivery
                            # copy pulled live from DeliveryContext
    pages/Login.jsx         # routes admin/rider/customer to different post-login pages
    pages/ForgotPassword.jsx
    pages/ResetPassword.jsx
    pages/Shop.jsx           # wishlist state wired into every card and rail
    pages/ProductDetail.jsx  # reviews + review submission
    pages/Wishlist.jsx        # saved-items page
    pages/Journal.jsx         # blog listing page
    pages/BlogPost.jsx
    pages/Cart.jsx
    pages/Checkout.jsx
    pages/Account.jsx        # order-status tracker + payment status
    pages/Admin.jsx           # stats, notifications, products, orders (incl. rider
                               # assignment), reviews, blog, riders, and settings
                               # (delivery rates + SasaPay) tabs
    pages/Rider.jsx            # standalone "My Deliveries" dashboard — its own
                                # minimal header, not the customer Navbar
    styles/theme.css          # shared design tokens (colors, fonts) matching the mockups
    App.jsx                   # routes + auth/admin/rider guards
    main.jsx
  index.html
  vite.config.js
  package.json
```

---

## 7. Design notes

The color palette and typography (Fraunces serif + Manrope sans, plum/rose/gold)
are centralized in `frontend/src/styles/theme.css` as CSS variables, so any visual
changes (rebrand, new accent color) happen in one place.

Delivery pricing lives in the database (`DeliverySettings`, editable from
**Admin > Settings**) and is fetched once per session via `DeliveryContext` on
the frontend — every page that mentions a fee (landing, cart, checkout,
product detail) reads from that same source, so changing the rate in one
place updates it everywhere without a code change or redeploy.

Admin accounts are intentionally kept out of the customer flow. The navbar hides
"My Account" and the cart icon for `is_admin` users, and the customer-only routes
(`/account`, `/cart`, `/checkout`) redirect an admin straight to `/admin` if they
land on them directly. The site owner manages the shop from `/admin` only — they
don't need a wishlist or a "continue shopping" link.

**Riders see a deliberately redacted view of every order.** `Order.to_dict_for_rider()`
never includes product names, categories, or prices — only what's needed to
complete a delivery (address, phone, notes, item count, and the cash amount
to collect for COD orders). This isn't an oversight or a "we'll add it later" —
discretion is the whole premise of the business, and that should hold
internally too. A rider doesn't need to know what's in the box any more than
a courier delivering a plain-packaged parcel from the outside would.

Product images are stored on disk under `backend/uploads/` and served back at
`/uploads/<filename>`. For production, you'll eventually want these on object
storage (S3, Cloudflare R2, etc.) rather than the local filesystem — fine for an
MVP and local testing, not fine once you're running on more than one server.

---

## 8. Roadmap

### v1 (implemented)
Three roles now: **Customer**, **Rider**, and **Admin**. Covers browsing, cart,
checkout with real SasaPay payments, wishlist, order history with rider-driven
status updates, product/stock management, reviews with moderation, a
blog/journal, and admin-configurable delivery rates.

### Rider / delivery role — implemented, not just planned
How it actually works:

- `User.is_rider` is a separate flag from `is_admin` — a rider account has
  neither shop access nor admin access, just its own `/rider` dashboard.
- `Order.assigned_rider_id` links an order to a rider; admins assign riders
  from a dropdown right in the Orders tab.
- A rider only ever sees orders assigned to them, and even then through
  `Order.to_dict_for_rider()` — a deliberately redacted view with no product
  names, categories, or prices. Just what's needed to complete a delivery:
  address, phone, notes, item count, and the cash amount to collect if it's
  COD. This matches the same discretion principle the whole storefront is
  built around — it applies to your own staff, not just customers.
- Riders move orders through `out_for_delivery` → `delivered`, or flag
  `delivery_failed` if they can't reach the customer — which is what makes
  the tracker on the customer's Account page reflect real movement.
- Still open: rider accounts share the same `/login` page as customers rather
  than having distinct branding, and there's no rider-initiated "delivery
  failed, retry" workflow beyond the admin reassigning it manually.

### Payment integration — SasaPay
**Implemented in v1** (not just planned). How it actually works:

- Credentials are entered live from the admin **Settings tab**, tested against
  SasaPay's real auth endpoint on save, and stored in the database
  (`PaymentSettings` table) rather than `.env` — the store owner can turn
  payments on without a code change or redeploy.
- Checkout calls SasaPay's `request-payment` endpoint for M-Pesa orders, which
  triggers an STK-style prompt on the customer's phone. SasaPay then calls
  back to `/api/orders/sasapay-callback` with the result, which is matched to
  the order by `CheckoutRequestID` and flips `payment_status` to `paid` or
  `failed`.
- If SasaPay isn't enabled, or the request fails for any reason, checkout
  **still succeeds** — the order is saved with `payment_status: "manual"` and
  the customer is told you'll follow up on payment directly, rather than the
  whole purchase failing over a payment-gateway hiccup.
- Still open: the base URL in `app/payments/sasapay.py` points at SasaPay's
  **sandbox**, and the callback payload parser (`sasapay_callback` in
  `orders/routes.py`) makes a best-effort guess at field names since SasaPay's
  docs don't fully spell out the callback shape — worth confirming against
  what actually arrives in your sandbox logs (it logs the full body) and
  adjusting field names there if needed before going live.
- **Cards**: SasaPay is mobile-money only — it does not process card payments.
  The "Debit/Credit Card" option on checkout is still a placeholder; orders
  placed with it are saved the same way as `manual` M-Pesa orders. If you want
  card payments to actually work, you'll need a second provider (e.g. Pesapal
  or Flutterwave) alongside SasaPay.

### Other things worth adding later
- **Object storage for images** — move `backend/uploads/` to S3/R2 once you're
  running more than one server, or want photos to survive a redeploy.
- **Pagination** — the product table and shop grid load everything at once;
  fine at dozens of products, not fine at thousands.
- **Rich text / markdown editor** for blog posts — the admin editor is currently
  a plain textarea with `**bold**` support only; a proper markdown or WYSIWYG
  editor would make longer posts easier to format.

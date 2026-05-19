# AutoCare

Pakistan's trust-first car marketplace and vehicle service management platform. Buyers browse verified listings, owners track their garage and service history, mechanics log verified service records via QR scan, and admins manage identity verification.

## Tech Stack

- **Frontend:** Vanilla HTML, CSS, JavaScript (no framework)
- **Backend:** [Supabase](https://supabase.com) (Postgres, Auth, Storage, Realtime)
- **Maps:** [Leaflet.js](https://leafletjs.com)
- **Charts:** [Chart.js](https://www.chartjs.org)
- **Marketing page:** React 18 + Tailwind CSS (CDN)

## Folder Structure

```
Auto_Care/
├── app/
│   ├── shared/          # supabase.js, app.css, inapp.css, mobile.css, icons.js
│   ├── buyer/           # Browse listings, saved, account
│   ├── owner/           # Garage dashboard, add vehicle, reminders
│   ├── mechanic/        # Dashboard, QR scan, log service, verify, account
│   ├── seller/          # Seller listings, account
│   ├── chat/            # Inbox, conversation detail
│   ├── admin/           # Verifications queue, analytics
│   ├── listing/         # Listing detail page
│   ├── login.html
│   ├── signup.html
│   ├── nearby.html      # Find workshop (Leaflet map)
│   ├── emergency.html
│   └── service-passport.html
└── marketing/
    └── AutoMart_Landing.html   # React + Tailwind landing page
```

## Running Locally

1. Install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension in VS Code.
2. Open the project folder in VS Code.
3. Right-click `app/login.html` → **Open with Live Server**.
4. The app runs at `http://127.0.0.1:5500` — all absolute paths (`/app/...`) resolve correctly.

> Supabase anon key is intentionally public — it is safe to commit. Row-level security (RLS) policies on the database enforce all access control.

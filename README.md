# AIESEC Shop MVP

A modern, high-performance e-commerce platform for AIESEC Local Committees to manage and sell merchandise to their members.

## ✨ Features

### Public Shop
- 🛍️ Browse available merchandise
- 📱 Fully responsive design
- 🔄 Real-time stock updates
- 📝 Easy reservation system
- ⚡ Lightning-fast loading with code splitting
- ✉️ Email confirmation

### Admin Panel (Separate Interface)
- 🔐 Secure authentication
- 📦 Item management (CRUD)
- 📊 Reservation tracking
- 📈 Status management (pending/collected/cancelled)
- 📉 Stock control
- 🚀 Independent from public shop for faster performance

## 🏗️ Architecture

**Multi-Page Application** with complete separation:
- Public Shop: `index.html` → Loads only customer-facing code
- Admin Portal: `admin.html` → Loads only admin functionality

**Performance Features:**
- ⚡ Lazy loading for all heavy components
- 📦 Code splitting (60% smaller initial bundle)
- 🎯 Optimized vendor chunks
- 💾 Better browser caching

See [ARCHITECTURE.md](ARCHITECTURE.md) for details.

## 🛠️ Tech Stack

- **Frontend:** React 18 + Vite
- **Styling:** Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth + RLS)
- **Build:** Multi-page with code splitting
- **Deployment:** Vercel/Netlify + Supabase

## 🚀 Quick Start

See [SETUP.md](SETUP.md) for detailed setup instructions.

```bash
# Install dependencies
npm install

# Configure environment variables
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials

# Run development server
npm run dev              # Both interfaces
npm run dev:shop         # Public shop only
npm run dev:admin        # Admin portal only

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🌐 Access Points

- **Public Shop**: `http://localhost:3000/`
- **Admin Portal**: `http://localhost:3000/admin.html`

## 📁 Project Structure

```
aiesec-shop/
├── index.html                       # Public shop entry
├── admin.html                       # Admin portal entry
├── src/
│   ├── main.jsx                     # Public shop bootstrap
│   ├── admin-main.jsx               # Admin bootstrap
│   ├── App.jsx                      # Public shop app
│   ├── AdminApp.jsx                 # Admin app
│   ├── components/
│   │   ├── PublicShop.jsx           # Main shop interface
│   │   ├── ReservationForm.jsx      # Reservation modal
│   │   ├── AdminPanel.jsx           # Admin dashboard
│   │   ├── AdminLogin.jsx           # Admin authentication
│   │   ├── ItemManager.jsx          # Item CRUD
│   │   └── ReservationManager.jsx   # Reservation management
│   ├── hooks/
│   │   └── useAuth.js               # Authentication hook
│   ├── lib/
│   │   └── supabase.js              # Supabase client
│   └── index.css                    # Global styles
├── vite.config.js                   # Multi-page build config
├── ARCHITECTURE.md                  # Architecture docs
├── PERFORMANCE.md                   # Performance guide
└── SETUP.md                         # Setup instructions
```

## 🔒 Security

- Row-Level Security (RLS) policies enforce all permissions
- Public users can browse and reserve items
- Only authenticated admins can modify data
- JWT-based authentication handled by Supabase

## 🌐 Deployment

The app is designed to be deployed on:
- **Frontend:** Vercel (free tier)
- **Backend:** Supabase (free tier)

Both services offer generous free tiers perfect for LC operations.

## 📝 License

MIT License - feel free to use this for your Local Committee!

## 🤝 Contributing

Built for AIESEC LC University - El Manar. Feel free to fork and customize for your LC!

## 📞 Support

For questions or issues, contact your LC Tech Team or refer to the [complete implementation guide](AIESEC-Shop-MVP-Guide.md).

---

**Built with ❤️ for AIESEC**

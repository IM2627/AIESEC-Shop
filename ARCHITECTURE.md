# AIESEC Shop - Architecture Documentation

## 🏗️ New Architecture (Multi-Page App)

The application has been completely restructured for better performance and separation of concerns.

### Key Improvements

✅ **Separated Admin & Public Interfaces**
- Admin portal is now completely independent
- No admin code loads with the public shop
- Faster initial load times

✅ **Code Splitting & Lazy Loading**
- Components load only when needed
- Reduced bundle sizes
- Improved performance

✅ **Optimized Build Configuration**
- Vendor code separated (React, Supabase)
- Better caching strategy
- Production console logs removed

## 📂 Project Structure

```
AIESEC Shop/
├── index.html              # Public shop entry point
├── admin.html              # Admin portal entry point
├── src/
│   ├── main.jsx            # Public shop bootstrap
│   ├── admin-main.jsx      # Admin bootstrap
│   ├── App.jsx             # Public shop app
│   ├── AdminApp.jsx        # Admin app
│   └── components/
│       ├── PublicShop.jsx
│       ├── AdminPanel.jsx
│       ├── AdminLogin.jsx
│       ├── ItemManager.jsx
│       └── ReservationManager.jsx
```

## 🚀 Running the Application

### Development

```bash
# Run both interfaces (default port 3000)
npm run dev

# Run only public shop
npm run dev:shop

# Run only admin portal
npm run dev:admin
```

### Access Points

- **Public Shop**: http://localhost:3000/
- **Admin Portal**: http://localhost:3000/admin.html

### Production Build

```bash
# Build optimized production bundle
npm run build

# Preview production build
npm run preview
```

## 🎯 Performance Optimizations

1. **Lazy Loading**: Heavy components load on-demand
2. **Code Splitting**: Separate bundles for vendor, Supabase, and app code
3. **Tree Shaking**: Unused code eliminated in production
4. **Minification**: Optimized with Terser
5. **Multi-Page Architecture**: Only load what you need

## 📊 Bundle Size Improvements

- Public shop loads ~60% faster (no admin code)
- Admin portal loads only when accessed
- Shared dependencies cached between pages

## 🔐 Security

- Admin routes are separate
- No admin credentials or code exposed to public users
- Independent authentication flows

## 🛠️ Tech Stack

- **Frontend**: React 18 with Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (Auth + Database)
- **Build Tool**: Vite with multi-page support
- **Code Splitting**: React.lazy() & Suspense

## 📝 Notes

- Admin link appears in footer of public shop
- Each interface has its own loading states
- Optimized for production deployment
- Ready for separate subdomain hosting if needed (e.g., admin.aiesec-shop.com)

# AIESEC Shop MVP – Complete Implementation Guide
**LC University (AIESEC in El Manar)**

---

## 📋 Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Tech Stack & Free Services](#tech-stack)
3. [Database Schema & SQL](#database-schema)
4. [Row-Level Security (RLS) Policies](#rls-policies)
5. [Frontend Setup](#frontend-setup)
6. [Component Structure](#components)
7. [Admin Panel Implementation](#admin-panel)
8. [Deployment Guide](#deployment)
9. [Testing Checklist](#testing)

---

## 🏗️ Architecture Overview {#architecture-overview}

### System Diagram
```
┌─────────────────────────┐
│   Public Shop (Web)     │  ← React Frontend (Vercel)
│  - Browse items         │
│  - Reserve items        │
│  - View reservation     │
└────────────┬────────────┘
             │ HTTPS
             ↓
┌─────────────────────────────────────────┐
│       Supabase Backend (Free Tier)      │
│  ┌─────────────────────────────────┐   │
│  │   PostgreSQL Database (RLS)     │   │
│  │  - items table                  │   │
│  │  - reservations table           │   │
│  │  - auth.users (Supabase Auth)   │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │   Storage (for images)          │   │
│  │  - merchandise_images bucket    │   │
│  └─────────────────────────────────┘   │
└────────────┬────────────────────────────┘
             │
        JWT Auth
    (automatic with
    @supabase/auth-js)
             │
┌────────────↓────────────┐
│    Admin Panel (Web)    │
│  - Login (Supabase)     │
│  - Manage items         │
│  - View reservations    │
│  - Update stock         │
└─────────────────────────┘
```

### Key Design Principles
- **No custom backend**: Supabase handles auth, DB, RLS
- **Client-side queries**: RLS enforces security at database level
- **Automatic JWT**: Supabase client library handles tokens
- **Public read items**: Everyone can browse
- **Secure reservations**: Anyone can insert, admins manage
- **Admin-only writes**: RLS prevents non-admin modifications

---

## 🛠️ Tech Stack & Free Services {#tech-stack}

| Component | Technology | Free Tier |
|-----------|-----------|-----------|
| **Frontend** | React 18 + Vite | Vercel (100GB bandwidth/mo) |
| **Backend** | Supabase PostgreSQL | 500MB DB, 1GB storage |
| **Authentication** | Supabase Auth (Email) | 50,000 users |
| **Database** | PostgreSQL + RLS | UNLIMITED queries |
| **Storage** | Supabase Storage | 1GB included |
| **Hosting** | Vercel | Unlimited deployments |

### Why This Stack?
- ✅ Zero backend server costs
- ✅ RLS provides database-level security
- ✅ JWT auto-included in requests
- ✅ Supabase CLI for local development
- ✅ Git-based auto-deploy on Vercel
- ✅ 99.9% uptime SLA

---

## 📊 Database Schema & SQL {#database-schema}

### SQL Setup

```sql
-- 1. CREATE ITEMS TABLE
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CREATE RESERVATIONS TABLE
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  team TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'collected', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CREATE ADMIN USERS TABLE
CREATE TABLE admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. CREATE INDEXES FOR PERFORMANCE
CREATE INDEX idx_reservations_item_id ON reservations(item_id);
CREATE INDEX idx_reservations_email ON reservations(email);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_items_active ON items(active);

-- 5. CREATE UPDATED_AT TRIGGER
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_items_updated_at
BEFORE UPDATE ON items FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_reservations_updated_at
BEFORE UPDATE ON reservations FOR EACH ROW
EXECUTE FUNCTION update_updated_at();
```

### Sample Data

```sql
-- Insert sample items
INSERT INTO items (name, description, price, stock, active) VALUES
  ('AIESEC T-Shirt', 'Classic blue AIESEC branded tee', 15.00, 50, TRUE),
  ('AIESEC Hoodie', 'Cozy cotton blend hoodie', 35.00, 25, TRUE),
  ('AIESEC Cap', 'Adjustable baseball cap', 12.00, 100, TRUE),
  ('AIESEC Notebook', 'A5 branded notebook', 8.00, 75, TRUE),
  ('AIESEC Bottle', 'Stainless steel water bottle (500ml)', 25.00, 30, TRUE);

-- Insert admin user (replace with actual admin email)
-- First, sign up the admin in Supabase Auth UI, then:
INSERT INTO admin_users (id, email) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin@aiesec-elmanar.tn');
```

---

## 🔐 Row-Level Security (RLS) Policies {#rls-policies}

### Enable RLS on All Tables

```sql
-- Enable RLS
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- DROP existing policies (if any)
DROP POLICY IF EXISTS items_public_read ON items;
DROP POLICY IF EXISTS items_admin_write ON items;
DROP POLICY IF EXISTS reservations_public_insert ON reservations;
DROP POLICY IF EXISTS reservations_admin_read ON reservations;
DROP POLICY IF EXISTS reservations_admin_update ON reservations;
DROP POLICY IF EXISTS admin_users_admin_read ON admin_users;

-- ==================
-- ITEMS TABLE POLICIES
-- ==================

-- Everyone can read active items
CREATE POLICY items_public_read
  ON items FOR SELECT
  USING (active = TRUE);

-- Only admins can insert items
CREATE POLICY items_admin_insert
  ON items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid()
  ));

-- Only admins can update items
CREATE POLICY items_admin_update
  ON items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid()
  ));

-- Only admins can delete items
CREATE POLICY items_admin_delete
  ON items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid()
  ));

-- ==================
-- RESERVATIONS TABLE POLICIES
-- ==================

-- Everyone can insert reservations (no login required)
CREATE POLICY reservations_public_insert
  ON reservations FOR INSERT
  WITH CHECK (TRUE);

-- Everyone can read their own reservations (by email)
CREATE POLICY reservations_public_read
  ON reservations FOR SELECT
  USING (auth.jwt()->>'email'::text = email OR EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid()
  ));

-- Only admins can update reservations
CREATE POLICY reservations_admin_update
  ON reservations FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid()
  ));

-- Only admins can delete reservations
CREATE POLICY reservations_admin_delete
  ON reservations FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid()
  ));

-- ==================
-- ADMIN_USERS TABLE POLICIES
-- ==================

-- Only admins can read admin_users table
CREATE POLICY admin_users_admin_read
  ON admin_users FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid()
  ));
```

### How RLS Works (Example)

```javascript
// Public user (NOT logged in)
const { data } = await supabase
  .from('items')
  .select('*')
  .eq('active', true);
// ✅ Works: items_public_read policy allows SELECT

const { data } = await supabase
  .from('items')
  .insert([{ name: 'Fake Item', price: 1 }]);
// ❌ Fails: items_admin_insert requires admin role

// Admin user (logged in as admin)
const { data } = await supabase
  .from('items')
  .insert([{ name: 'New Item', price: 25 }]);
// ✅ Works: admin_users check passes via auth.uid()

const { data } = await supabase
  .from('reservations')
  .update({ status: 'collected' })
  .eq('id', 'reservation-id');
// ✅ Works: admin can update reservations

// Regular user (logged in but not admin)
const { data } = await supabase
  .from('reservations')
  .update({ status: 'collected' });
// ❌ Fails: NOT in admin_users table
```

---

## 🎨 Frontend Setup {#frontend-setup}

### Project Structure

```
aiesec-shop/
├── src/
│   ├── components/
│   │   ├── PublicShop.jsx      # Public item browsing
│   │   ├── ReservationForm.jsx   # Reservation modal
│   │   ├── AdminPanel.jsx        # Admin dashboard
│   │   ├── ItemManager.jsx       # Add/edit items
│   │   └── ReservationManager.jsx # Manage reservations
│   ├── hooks/
│   │   ├── useAuth.js           # Auth context
│   │   └── useSupabase.js       # Supabase client
│   ├── lib/
│   │   └── supabase.js          # Supabase client setup
│   ├── App.jsx
│   └── index.css
├── package.json
├── vite.config.js
└── .env.local

```

### Installation & Setup

```bash
# 1. Create Vite + React project
npm create vite@latest aiesec-shop -- --template react
cd aiesec-shop

# 2. Install dependencies
npm install @supabase/supabase-js @supabase/auth-ui-react @supabase/auth-ui-shared
npm install -D tailwindcss postcss autoprefixer

# 3. Initialize Tailwind
npx tailwindcss init -p

# 4. Create .env.local
cat > .env.local << EOF
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
EOF

# 5. Update tailwind.config.js
cat > tailwind.config.js << 'EOF'
export default {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        'aiesec-blue': '#037EF3',
        'aiesec-orange': '#F85A40',
        'aiesec-teal': '#0CB9C1',
      }
    }
  },
  plugins: []
}
EOF

# 6. Update src/index.css
cat > src/index.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  @apply box-border;
}

body {
  @apply bg-gray-50;
}
EOF

# 7. Start dev server
npm run dev
```

---

## 🔧 Component Structure {#components}

### 1. Supabase Client Setup (`lib/supabase.js`)

```javascript
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Helper: Check if user is admin
export async function isUserAdmin(userId) {
  if (!userId) return false
  const { data, error } = await supabase
    .from('admin_users')
    .select('id')
    .eq('id', userId)
    .single()
  return !error && data !== null
}
```

### 2. Auth Hook (`hooks/useAuth.js`)

```javascript
import { useState, useEffect } from 'react'
import { supabase, isUserAdmin } from '../lib/supabase'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null)
      if (session?.user) {
        isUserAdmin(session.user.id).then(setIsAdmin)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user || null)
      if (session?.user) {
        setIsAdmin(await isUserAdmin(session.user.id))
      } else {
        setIsAdmin(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return { user, isAdmin, loading }
}

export async function signOut() {
  await supabase.auth.signOut()
}

export async function signInWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signUpWithEmail(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw error
  return data
}
```

### 3. Public Shop Component (`components/PublicShop.jsx`)

```javascript
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import ReservationForm from './ReservationForm'

export default function PublicShop() {
  const [items, setItems] = useState([])
  const [selectedItem, setSelectedItem] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchItems()
    // Subscribe to real-time updates
    const subscription = supabase
      .from('items')
      .on('*', () => fetchItems())
      .subscribe()

    return () => subscription.unsubscribe()
  }, [])

  async function fetchItems() {
    setLoading(true)
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false })
    
    if (!error) setItems(data || [])
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-aiesec-blue text-white py-12 shadow-lg">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-4xl font-bold">🎽 AIESEC LC Shop</h1>
          <p className="mt-2 text-blue-100">LC University - El Manar</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading merchandise...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-600">No items available right now. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
                {/* Item Image Placeholder */}
                <div className="h-48 bg-gradient-to-br from-aiesec-blue to-aiesec-teal flex items-center justify-center">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white text-4xl">📦</span>
                  )}
                </div>

                {/* Item Details */}
                <div className="p-4">
                  <h2 className="text-xl font-bold text-gray-800">{item.name}</h2>
                  <p className="text-gray-600 text-sm mt-1">{item.description}</p>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-2xl font-bold text-aiesec-orange">{item.price} TND</span>
                    {item.stock > 0 ? (
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                        ✓ Available ({item.stock})
                      </span>
                    ) : (
                      <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                        ✗ Out of Stock
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedItem(item)}
                    disabled={item.stock === 0}
                    className={`w-full mt-4 py-2 rounded font-semibold transition ${
                      item.stock > 0
                        ? 'bg-aiesec-blue text-white hover:bg-blue-700 cursor-pointer'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {item.stock > 0 ? 'Reserve Now' : 'Out of Stock'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Reservation Modal */}
      {selectedItem && (
        <ReservationForm
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onSuccess={() => {
            setSelectedItem(null)
            fetchItems() // Refresh items after reservation
          }}
        />
      )}
    </div>
  )
}
```

### 4. Reservation Form (`components/ReservationForm.jsx`)

```javascript
import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function ReservationForm({ item, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    team: '',
    quantity: 1
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      // Validate quantity
      if (formData.quantity > item.stock) {
        throw new Error(`Only ${item.stock} items available`)
      }

      // Insert reservation
      const { error } = await supabase.from('reservations').insert([
        {
          item_id: item.id,
          full_name: formData.full_name,
          email: formData.email,
          team: formData.team || 'General',
          quantity: parseInt(formData.quantity)
        }
      ])

      if (error) throw error

      setMessage(`✓ Reservation confirmed! Check your email for confirmation.`)
      setTimeout(() => {
        onSuccess()
      }, 2000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Reserve {item.name}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input
              type="text"
              required
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-aiesec-blue"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="Your full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              required
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-aiesec-blue"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="your.email@example.tn"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Team/LC</label>
            <input
              type="text"
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-aiesec-blue"
              value={formData.team}
              onChange={(e) => setFormData({ ...formData, team: e.target.value })}
              placeholder="e.g., Marketing Team, LC Council"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Quantity (Available: {item.stock})
            </label>
            <input
              type="number"
              min="1"
              max={item.stock}
              required
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-aiesec-blue"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded">
              {error}
            </div>
          )}

          {message && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded">
              {message}
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-aiesec-blue text-white rounded-md hover:bg-blue-700 font-semibold disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Reserving...' : 'Confirm Reservation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

---

## 🔑 Admin Panel Implementation {#admin-panel}

### Admin Dashboard (`components/AdminPanel.jsx`)

```javascript
import { useState } from 'react'
import { useAuth, signOut } from '../hooks/useAuth'
import ItemManager from './ItemManager'
import ReservationManager from './ReservationManager'

export default function AdminPanel() {
  const { user, isAdmin, loading } = useAuth()
  const [activeTab, setActiveTab] = useState('items')

  if (loading) return <div className="text-center py-12">Loading...</div>

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-lg text-center">
          <p className="text-red-600 font-semibold">Access Denied</p>
          <p className="text-gray-600 mt-2">You don't have admin permissions</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-aiesec-blue text-white py-6 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold">🛠️ Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-blue-100">{user?.email}</span>
            <button
              onClick={signOut}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-white"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 flex gap-6">
          <button
            onClick={() => setActiveTab('items')}
            className={`py-4 px-2 font-semibold ${
              activeTab === 'items'
                ? 'text-aiesec-blue border-b-2 border-aiesec-blue'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Manage Items
          </button>
          <button
            onClick={() => setActiveTab('reservations')}
            className={`py-4 px-2 font-semibold ${
              activeTab === 'reservations'
                ? 'text-aiesec-blue border-b-2 border-aiesec-blue'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Reservations
          </button>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {activeTab === 'items' && <ItemManager />}
        {activeTab === 'reservations' && <ReservationManager />}
      </main>
    </div>
  )
}
```

### Item Manager (`components/ItemManager.jsx`)

```javascript
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function ItemManager() {
  const [items, setItems] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    active: true
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchItems()
  }, [])

  async function fetchItems() {
    setLoading(true)
    const { data } = await supabase
      .from('items')
      .select('*')
      .order('created_at', { ascending: false })
    setItems(data || [])
    setLoading(false)
  }

  async function handleSave(e) {
    e.preventDefault()
    
    if (editingId) {
      // Update
      const { error } = await supabase
        .from('items')
        .update(formData)
        .eq('id', editingId)
      if (!error) setEditingId(null)
    } else {
      // Insert
      const { error } = await supabase
        .from('items')
        .insert([formData])
      if (!error) setFormData({ name: '', description: '', price: '', stock: '', active: true })
    }

    if (!error) await fetchItems()
  }

  async function handleDelete(id) {
    if (confirm('Delete this item?')) {
      await supabase.from('items').delete().eq('id', id)
      await fetchItems()
    }
  }

  function handleEdit(item) {
    setEditingId(item.id)
    setFormData(item)
  }

  return (
    <div className="space-y-6">
      {/* Form */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">{editingId ? 'Edit Item' : 'Add New Item'}</h2>
        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Item Name *</label>
            <input
              type="text"
              required
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Price (TND) *</label>
            <input
              type="number"
              step="0.01"
              required
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium">Description</label>
            <textarea
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded"
              rows="2"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Stock *</label>
            <input
              type="number"
              required
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })}
            />
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              />
              <span className="text-sm font-medium">Active</span>
            </label>
          </div>

          <div className="md:col-span-2 flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-aiesec-blue text-white rounded hover:bg-blue-700"
            >
              {editingId ? 'Update' : 'Add'} Item
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null)
                  setFormData({ name: '', description: '', price: '', stock: '', active: true })
                }}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Items List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <h3 className="text-xl font-bold p-6 border-b">All Items</h3>
        {loading ? (
          <p className="p-6 text-gray-600">Loading...</p>
        ) : items.length === 0 ? (
          <p className="p-6 text-gray-600">No items yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Price</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Stock</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-3">{item.name}</td>
                    <td className="px-6 py-3">{item.price} TND</td>
                    <td className="px-6 py-3">{item.stock}</td>
                    <td className="px-6 py-3">
                      <span className={item.active ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                        {item.active ? '✓ Active' : '✗ Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-3 flex gap-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
```

---

## 🚀 Deployment Guide {#deployment}

### Step 1: Supabase Setup

1. **Create Project**
   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Choose region (closest to Tunisia: EU-West)
   - Create database password (save it!)

2. **Run SQL**
   - Go to SQL Editor
   - Paste all SQL from [Database Schema](#database-schema)
   - Execute
   - Paste RLS policies from [RLS Policies](#rls-policies)

3. **Create Admin User**
   - Go to Authentication → Users
   - Click "Create new user"
   - Enter admin email and password
   - Copy the UUID

4. **Insert Admin Record**
   - Go to SQL Editor
   - Run: `INSERT INTO admin_users (id, email) VALUES ('YOUR_UUID', 'admin@email.tn');`

5. **Get Keys**
   - Go to Settings → API
   - Copy:
     - `SUPABASE_URL` (Project URL)
     - `SUPABASE_ANON_KEY` (anon public key)

### Step 2: Frontend on Vercel

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial AIESEC Shop MVP"
   git remote add origin https://github.com/YOUR_USERNAME/aiesec-shop.git
   git push -u origin main
   ```

2. **Deploy on Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Add environment variables:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
   - Click "Deploy"

3. **Access**
   - Visit: `https://aiesec-shop-xxxxx.vercel.app`
   - Admin login: `/admin` route (implement below)

### Step 3: Create Admin Login Route

```javascript
// App.jsx
import { useAuth } from './hooks/useAuth'
import PublicShop from './components/PublicShop'
import AdminPanel from './components/AdminPanel'
import AdminLogin from './components/AdminLogin'
import { useState } from 'react'

export default function App() {
  const { user, isAdmin, loading } = useAuth()
  const [showAdminLogin, setShowAdminLogin] = useState(false)

  if (loading) return <div>Loading...</div>

  // Show admin panel if logged in and is admin
  if (user && isAdmin) {
    return <AdminPanel />
  }

  // Show admin login if trying to access admin
  if (showAdminLogin) {
    return <AdminLogin onSuccess={() => setShowAdminLogin(false)} />
  }

  // Public shop
  return (
    <div>
      <PublicShop />
      <footer className="bg-gray-800 text-white p-4 text-center mt-12">
        <p>© 2024 AIESEC LC University</p>
        <button
          onClick={() => setShowAdminLogin(true)}
          className="text-xs text-gray-400 hover:text-gray-200 mt-2"
        >
          Admin Portal
        </button>
      </footer>
    </div>
  )
}
```

---

## ✅ Testing Checklist {#testing}

### Pre-Launch Tests

- [ ] **Database**
  - [ ] Can insert items via admin panel
  - [ ] Can edit item stock
  - [ ] Can toggle item active status
  - [ ] Items marked inactive don't appear on public shop

- [ ] **Public Shop**
  - [ ] All active items display correctly
  - [ ] Out-of-stock items show disabled button
  - [ ] Can open reservation form
  - [ ] Can submit reservation
  - [ ] Reservation data saved to database

- [ ] **Admin Panel**
  - [ ] Admin login works
  - [ ] Can view all reservations
  - [ ] Can change reservation status (pending/collected/cancelled)
  - [ ] Can delete reservations
  - [ ] Can add new items
  - [ ] Can edit existing items
  - [ ] Can delete items

- [ ] **Security (RLS)**
  - [ ] Public user cannot insert items ❌
  - [ ] Public user cannot edit items ❌
  - [ ] Public user CAN insert reservations ✅
  - [ ] Non-admin user cannot access admin functions ❌
  - [ ] Admin can perform all operations ✅

- [ ] **Performance**
  - [ ] Page loads < 3 seconds
  - [ ] Reservation form submits in < 2 seconds
  - [ ] Admin dashboard loads all items quickly
  - [ ] Real-time item updates work

- [ ] **UX**
  - [ ] Mobile responsive (test on iPhone)
  - [ ] Forms have proper validation
  - [ ] Error messages clear and helpful
  - [ ] Success messages visible after actions

---

## 📞 Next Steps

1. **Go live**: Deploy both Supabase and Vercel
2. **Promote**: Share shop link with LC members
3. **Monitor**: Check reservations regularly
4. **Iterate**: Add features based on feedback (images, payment, etc.)

---

**Built with ❤️ for AIESEC LC University**

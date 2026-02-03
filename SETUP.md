# AIESEC Shop MVP - Setup Instructions

## 🚀 Quick Start Guide

### Prerequisites
- Node.js 18+ installed
- A Supabase account (free tier)
- A code editor (VS Code recommended)

---

## 📦 Step 1: Install Dependencies

```bash
# Navigate to the project folder
cd "c:\Users\Mohamed\Desktop\AIESEC Shop"

# Install dependencies
npm install
```

---

## 🗄️ Step 2: Set Up Supabase

### 2.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click **"New Project"**
3. Choose a name (e.g., "aiesec-shop")
4. Select region: **EU-West** (closest to Tunisia)
5. Create a strong database password (save it!)

### 2.2 Run Database Setup
1. In Supabase dashboard, go to **SQL Editor**
2. Open the `AIESEC-Shop-MVP-Guide.md` file
3. Copy and paste the SQL from the **"Database Schema & SQL"** section
4. Click **"Run"** to execute
5. Then copy and paste the SQL from the **"Row-Level Security (RLS) Policies"** section
6. Click **"Run"** again

### 2.3 Create Admin User
1. In Supabase, go to **Authentication** → **Users**
2. Click **"Add user"** → **"Create new user"**
3. Enter your admin email and password
4. Copy the **User UID** that appears

### 2.4 Insert Admin Record
1. Go back to **SQL Editor**
2. Run this SQL (replace with your actual UUID and email):
```sql
INSERT INTO admin_users (id, email) VALUES 
  ('YOUR_USER_UUID_HERE', 'admin@aiesec-elmanar.tn');
```

### 2.5 Get API Keys
1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key

---

## 🔧 Step 3: Configure Environment Variables

1. Copy the example environment file:
```bash
cp .env.local.example .env.local
```

2. Edit `.env.local` and add your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

---

## ▶️ Step 4: Run the Development Server

```bash
npm run dev
```

The app should open at: **http://localhost:3000**

---

## ✅ Step 5: Test the Application

### Test Public Shop
1. Open http://localhost:3000
2. You should see the AIESEC LC Shop homepage
3. Try clicking "Reserve Now" on any item

### Test Admin Panel
1. Click **"Admin Portal"** in the footer
2. Login with your admin email and password
3. You should see the admin dashboard
4. Try:
   - Adding a new item
   - Viewing reservations
   - Updating item stock

---

## 🌐 Step 6: Deploy to Production

### Deploy Frontend (Vercel - Recommended)

1. **Push to GitHub**
```bash
git init
git add .
git commit -m "Initial AIESEC Shop MVP"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/aiesec-shop.git
git push -u origin main
```

2. **Deploy on Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click **"New Project"**
   - Import your GitHub repository
   - Add environment variables:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
   - Click **"Deploy"**

3. **Access Your Live Site**
   - Vercel will provide a URL like: `https://aiesec-shop-xxxxx.vercel.app`
   - Share this with your LC members!

---

## 📊 Adding Sample Data (Optional)

If you want to populate your shop with sample items, run this SQL in Supabase:

```sql
INSERT INTO items (name, description, price, stock, active) VALUES
  ('AIESEC T-Shirt', 'Classic blue AIESEC branded tee', 15.00, 50, TRUE),
  ('AIESEC Hoodie', 'Cozy cotton blend hoodie', 35.00, 25, TRUE),
  ('AIESEC Cap', 'Adjustable baseball cap', 12.00, 100, TRUE),
  ('AIESEC Notebook', 'A5 branded notebook', 8.00, 75, TRUE),
  ('AIESEC Bottle', 'Stainless steel water bottle (500ml)', 25.00, 30, TRUE);
```

---

## 🔒 Security Notes

- **RLS is enabled**: All security is handled at the database level
- **Public users** can:
  - Browse items
  - Create reservations
- **Admin users** can:
  - Manage items (CRUD)
  - View all reservations
  - Update reservation status
- **Non-admin users** cannot access admin functions even if they try

---

## 🛠️ Troubleshooting

### "Missing Supabase environment variables"
- Make sure `.env.local` exists in the root folder
- Check that both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
- Restart the dev server after adding environment variables

### Admin login doesn't work
- Verify the user exists in Supabase Auth → Users
- Verify the user's UUID is in the `admin_users` table
- Check SQL query: `SELECT * FROM admin_users;`

### Items not showing in public shop
- Make sure items have `active = TRUE`
- Check RLS policies are applied correctly
- Check browser console for errors

### Reservations not saving
- Check that RLS policy `reservations_public_insert` exists
- Verify stock is available (stock > 0)
- Check browser console for errors

---

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Vite Documentation](https://vitejs.dev)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com)

---

## 🎉 You're All Set!

Your AIESEC Shop MVP is now ready to use! 

**Next Steps:**
1. Customize the branding/colors in `tailwind.config.js`
2. Add real product images
3. Share the shop link with your LC
4. Monitor reservations in the admin panel

**Built with ❤️ for AIESEC LC University - El Manar**

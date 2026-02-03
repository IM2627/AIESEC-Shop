-- ==========================================
-- AIESEC Shop MVP - Database Setup SQL
-- Run this in your Supabase SQL Editor
-- ==========================================

-- 1. CREATE ITEMS TABLE
CREATE TABLE IF NOT EXISTS items (
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
CREATE TABLE IF NOT EXISTS reservations (
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
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. CREATE INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_reservations_item_id ON reservations(item_id);
CREATE INDEX IF NOT EXISTS idx_reservations_email ON reservations(email);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_items_active ON items(active);

-- 5. CREATE UPDATED_AT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. CREATE TRIGGERS FOR AUTO-UPDATE TIMESTAMPS
DROP TRIGGER IF EXISTS trigger_items_updated_at ON items;
CREATE TRIGGER trigger_items_updated_at
BEFORE UPDATE ON items FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_reservations_updated_at ON reservations;
CREATE TRIGGER trigger_reservations_updated_at
BEFORE UPDATE ON reservations FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- 7. ENABLE ROW LEVEL SECURITY
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- 8. DROP EXISTING POLICIES (if any)
DROP POLICY IF EXISTS items_public_read ON items;
DROP POLICY IF EXISTS items_admin_insert ON items;
DROP POLICY IF EXISTS items_admin_update ON items;
DROP POLICY IF EXISTS items_admin_delete ON items;
DROP POLICY IF EXISTS reservations_public_insert ON reservations;
DROP POLICY IF EXISTS reservations_public_read ON reservations;
DROP POLICY IF EXISTS reservations_admin_update ON reservations;
DROP POLICY IF EXISTS reservations_admin_delete ON reservations;
DROP POLICY IF EXISTS admin_users_admin_read ON admin_users;

-- 9. CREATE RLS POLICIES FOR ITEMS
CREATE POLICY items_public_read
  ON items FOR SELECT
  USING (active = TRUE);

CREATE POLICY items_admin_insert
  ON items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid()
  ));

CREATE POLICY items_admin_update
  ON items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid()
  ));

CREATE POLICY items_admin_delete
  ON items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid()
  ));

-- 10. CREATE RLS POLICIES FOR RESERVATIONS
CREATE POLICY reservations_public_insert
  ON reservations FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY reservations_public_read
  ON reservations FOR SELECT
  USING (TRUE);

CREATE POLICY reservations_admin_update
  ON reservations FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid()
  ));

CREATE POLICY reservations_admin_delete
  ON reservations FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid()
  ));

-- 11. CREATE RLS POLICIES FOR ADMIN_USERS
CREATE POLICY admin_users_admin_read
  ON admin_users FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid()
  ));

-- ==========================================
-- OPTIONAL: Insert Sample Data
-- ==========================================

-- Insert sample items (uncomment to use)
/*
INSERT INTO items (name, description, price, stock, active) VALUES
  ('AIESEC T-Shirt', 'Classic blue AIESEC branded tee', 15.00, 50, TRUE),
  ('AIESEC Hoodie', 'Cozy cotton blend hoodie', 35.00, 25, TRUE),
  ('AIESEC Cap', 'Adjustable baseball cap', 12.00, 100, TRUE),
  ('AIESEC Notebook', 'A5 branded notebook', 8.00, 75, TRUE),
  ('AIESEC Bottle', 'Stainless steel water bottle (500ml)', 25.00, 30, TRUE);
*/

-- ==========================================
-- IMPORTANT: Add Admin User
-- ==========================================
-- After creating a user in Supabase Auth UI, run:
-- INSERT INTO admin_users (id, email) VALUES ('YOUR_USER_UUID', 'admin@aiesec-elmanar.tn');

-- ==========================================
-- Setup Complete!
-- ==========================================

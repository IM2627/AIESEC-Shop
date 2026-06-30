-- ==========================================
-- AIESEC Shop - Database Setup / Upgrade SQL
-- Run this in your Supabase SQL Editor
-- ==========================================

-- 1. CREATE ITEMS TABLE
CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  active BOOLEAN DEFAULT TRUE,
  is_spotlight BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE items ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE items ADD COLUMN IF NOT EXISTS is_spotlight BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. CREATE RESERVATIONS TABLE
-- Legacy columns (email, team) are intentionally kept nullable for compatibility
-- with older deployments and admin views.
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  position TEXT,
  size TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  phone_number TEXT,
  maximum_delivery_date DATE,
  email TEXT,
  team TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'collected', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE reservations ADD COLUMN IF NOT EXISTS position TEXT;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS size TEXT;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS maximum_delivery_date DATE;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS team TEXT;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE reservations ALTER COLUMN email DROP NOT NULL;

UPDATE reservations
SET size = CASE
  WHEN size IN ('S', 'M', 'L', 'XL') THEN size
  WHEN lower(coalesce(team, '')) LIKE '%"size":"s"%' THEN 'S'
  WHEN lower(coalesce(team, '')) LIKE '%"size":"m"%' THEN 'M'
  WHEN lower(coalesce(team, '')) LIKE '%"size":"l"%' THEN 'L'
  WHEN lower(coalesce(team, '')) LIKE '%"size":"xl"%' THEN 'XL'
  ELSE size
END;

UPDATE items
SET category = CASE
  WHEN category IN ('T-shirts', 'Hoodies', 'Bracelets', 'Stickers') THEN category
  WHEN lower(btrim(category)) IN ('t-shirt', 't-shirts', 't shirt', 't shirts', 'tee', 'tees') THEN 'T-shirts'
  WHEN lower(btrim(category)) IN ('hoodie', 'hoodies') THEN 'Hoodies'
  WHEN lower(btrim(category)) IN ('bracelet', 'bracelets') THEN 'Bracelets'
  WHEN lower(btrim(category)) IN ('sticker', 'stickers') THEN 'Stickers'
  ELSE category
END
WHERE category IS NOT NULL;

UPDATE items
SET category = CASE
  WHEN lower(coalesce(name, '') || ' ' || coalesce(description, '')) ~ 'hoodie|hoodies' THEN 'Hoodies'
  WHEN lower(coalesce(name, '') || ' ' || coalesce(description, '')) ~ 'bracelet|bracelets' THEN 'Bracelets'
  WHEN lower(coalesce(name, '') || ' ' || coalesce(description, '')) ~ 'sticker|stickers' THEN 'Stickers'
  WHEN lower(coalesce(name, '') || ' ' || coalesce(description, '')) ~ 't-?shirt|t shirt|tshirts|tee|tees' THEN 'T-shirts'
  ELSE NULL
END
WHERE category IS NULL OR btrim(category) = '';

DO $$
DECLARE
  unresolved_count INTEGER;
  unresolved_items TEXT;
BEGIN
  SELECT COUNT(*)
  INTO unresolved_count
  FROM items
  WHERE category IS NULL OR category NOT IN ('T-shirts', 'Hoodies', 'Bracelets', 'Stickers');

  IF unresolved_count > 0 THEN
    SELECT string_agg(name, ', ' ORDER BY name)
    INTO unresolved_items
    FROM (
      SELECT name
      FROM items
      WHERE category IS NULL OR category NOT IN ('T-shirts', 'Hoodies', 'Bracelets', 'Stickers')
      ORDER BY name
      LIMIT 10
    ) unresolved;

    RAISE EXCEPTION
      'Category migration requires manual review for % item(s). Update these items first, then rerun the script. Sample items: %',
      unresolved_count,
      COALESCE(unresolved_items, 'n/a');
  END IF;
END $$;

-- 3. CREATE ADMIN USERS TABLE
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. CREATE INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_reservations_item_id ON reservations(item_id);
CREATE INDEX IF NOT EXISTS idx_reservations_phone_number ON reservations(phone_number);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_max_delivery_date ON reservations(maximum_delivery_date);
CREATE INDEX IF NOT EXISTS idx_items_active ON items(active);
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
CREATE UNIQUE INDEX IF NOT EXISTS idx_items_single_spotlight ON items(is_spotlight) WHERE is_spotlight = TRUE;

-- 5. CREATE UPDATED_AT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION enforce_single_spotlight_item()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_spotlight THEN
    UPDATE items
    SET is_spotlight = FALSE
    WHERE id <> NEW.id
      AND is_spotlight = TRUE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

ALTER TABLE items DROP CONSTRAINT IF EXISTS items_category_check;
ALTER TABLE items
  ADD CONSTRAINT items_category_check
  CHECK (category IN ('T-shirts', 'Hoodies', 'Bracelets', 'Stickers'));

ALTER TABLE items ALTER COLUMN category SET NOT NULL;

ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_size_check;
ALTER TABLE reservations
  ADD CONSTRAINT reservations_size_check
  CHECK (size IS NULL OR size IN ('S', 'M', 'L', 'XL'));

WITH spotlight_candidate AS (
  SELECT id
  FROM items
  ORDER BY
    active DESC,
    (stock > 0) DESC,
    (NULLIF(BTRIM(image_url), '') IS NOT NULL) DESC,
    created_at DESC
  LIMIT 1
)
UPDATE items
SET is_spotlight = TRUE
WHERE id = (SELECT id FROM spotlight_candidate)
  AND NOT EXISTS (
    SELECT 1
    FROM items
    WHERE is_spotlight = TRUE
  );

-- 6. CREATE TRIGGERS FOR AUTO-UPDATE TIMESTAMPS
DROP TRIGGER IF EXISTS trigger_items_updated_at ON items;
CREATE TRIGGER trigger_items_updated_at
BEFORE UPDATE ON items FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_items_single_spotlight ON items;
CREATE TRIGGER trigger_items_single_spotlight
BEFORE INSERT OR UPDATE OF is_spotlight ON items
FOR EACH ROW
EXECUTE FUNCTION enforce_single_spotlight_item();

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
DROP POLICY IF EXISTS reservations_admin_read ON reservations;
DROP POLICY IF EXISTS reservations_admin_update ON reservations;
DROP POLICY IF EXISTS reservations_admin_delete ON reservations;
DROP POLICY IF EXISTS admin_users_admin_read ON admin_users;

-- 9. CREATE RLS POLICIES FOR ITEMS
CREATE POLICY items_public_read
  ON items FOR SELECT
  USING (active = TRUE OR is_spotlight = TRUE);

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

CREATE POLICY reservations_admin_read
  ON reservations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid()
  ));

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

-- 11. CREATE RLS POLICY FOR ADMIN USERS
CREATE POLICY admin_users_admin_read
  ON admin_users FOR SELECT
  USING (id = auth.uid());

-- ==========================================
-- OPTIONAL SAMPLE DATA
-- ==========================================
/*
INSERT INTO items (name, description, price, stock, active) VALUES
  ('AIESEC T-Shirt', 'Classic blue AIESEC branded tee', 15.00, 50, TRUE),
  ('AIESEC Hoodie', 'Cozy cotton blend hoodie', 35.00, 25, TRUE),
  ('AIESEC Cap', 'Adjustable baseball cap', 12.00, 100, TRUE),
  ('AIESEC Notebook', 'A5 branded notebook', 8.00, 75, TRUE),
  ('AIESEC Bottle', 'Stainless steel water bottle (500ml)', 25.00, 30, TRUE);
*/

-- ==========================================
-- IMPORTANT: ADD ADMIN USER
-- ==========================================
-- After creating a user in Supabase Auth UI, run:
-- INSERT INTO admin_users (id, email) VALUES ('YOUR_USER_UUID', 'admin@aiesec-elmanar.tn');

-- ==========================================
-- RESERVATION FUNCTIONS
-- ==========================================

-- Legacy RPC retained for backwards compatibility.
CREATE OR REPLACE FUNCTION create_reservation(
  p_item_id   UUID,
  p_full_name TEXT,
  p_email     TEXT,
  p_team      TEXT,
  p_quantity  INT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_reservation_id UUID;
  v_team_json JSONB;
  v_position TEXT;
  v_size TEXT;
  v_maximum_delivery_date DATE;
BEGIN
  UPDATE items
  SET stock = stock - p_quantity
  WHERE id = p_item_id
    AND active = TRUE
    AND stock >= p_quantity;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient stock for this item';
  END IF;

  BEGIN
    v_team_json := p_team::jsonb;
  EXCEPTION WHEN others THEN
    v_team_json := jsonb_build_object('position', p_team);
  END;

  v_position := COALESCE(v_team_json ->> 'position', p_team);
  v_size := NULLIF(v_team_json ->> 'size', '');

  BEGIN
    v_maximum_delivery_date := NULLIF(v_team_json ->> 'maximumDeliveryDate', '')::date;
  EXCEPTION WHEN others THEN
    v_maximum_delivery_date := NULL;
  END;

  INSERT INTO reservations (
    item_id,
    full_name,
    email,
    team,
    position,
    size,
    phone_number,
    maximum_delivery_date,
    quantity,
    status
  )
  VALUES (
    p_item_id,
    p_full_name,
    p_email,
    p_team,
    v_position,
    v_size,
    p_email,
    v_maximum_delivery_date,
    p_quantity,
    'pending'
  )
  RETURNING id INTO v_reservation_id;

  RETURN v_reservation_id;
END;
$$;

-- New RPC for the refined reservation flow.
CREATE OR REPLACE FUNCTION create_reservation_v2(
  p_item_id UUID,
  p_full_name TEXT,
  p_position TEXT,
  p_quantity INT,
  p_phone_number TEXT,
  p_maximum_delivery_date DATE
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_reservation_id UUID;
BEGIN
  UPDATE items
  SET stock = stock - p_quantity
  WHERE id = p_item_id
    AND active = TRUE
    AND stock >= p_quantity;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient stock for this item';
  END IF;

  INSERT INTO reservations (
    item_id,
    full_name,
    position,
    size,
    quantity,
    phone_number,
    maximum_delivery_date,
    email,
    team,
    status
  )
  VALUES (
    p_item_id,
    p_full_name,
    p_position,
    NULL,
    p_quantity,
    p_phone_number,
    p_maximum_delivery_date,
    p_phone_number,
    json_build_object(
      'position', p_position,
      'maximumDeliveryDate', p_maximum_delivery_date
    )::text,
    'pending'
  )
  RETURNING id INTO v_reservation_id;

  RETURN v_reservation_id;
END;
$$;

CREATE OR REPLACE FUNCTION create_reservation_v3(
  p_item_id UUID,
  p_full_name TEXT,
  p_position TEXT,
  p_size TEXT,
  p_quantity INT,
  p_phone_number TEXT,
  p_maximum_delivery_date DATE
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_reservation_id UUID;
BEGIN
  IF p_size IS NOT NULL AND p_size NOT IN ('S', 'M', 'L', 'XL') THEN
    RAISE EXCEPTION 'Invalid size';
  END IF;

  UPDATE items
  SET stock = stock - p_quantity
  WHERE id = p_item_id
    AND active = TRUE
    AND stock >= p_quantity;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient stock for this item';
  END IF;

  INSERT INTO reservations (
    item_id,
    full_name,
    position,
    size,
    quantity,
    phone_number,
    maximum_delivery_date,
    email,
    team,
    status
  )
  VALUES (
    p_item_id,
    p_full_name,
    p_position,
    NULLIF(p_size, ''),
    p_quantity,
    p_phone_number,
    p_maximum_delivery_date,
    p_phone_number,
    json_build_object(
      'position', p_position,
      'size', NULLIF(p_size, ''),
      'maximumDeliveryDate', p_maximum_delivery_date
    )::text,
    'pending'
  )
  RETURNING id INTO v_reservation_id;

  RETURN v_reservation_id;
END;
$$;

GRANT EXECUTE ON FUNCTION create_reservation(UUID, TEXT, TEXT, TEXT, INT) TO anon;
GRANT EXECUTE ON FUNCTION create_reservation(UUID, TEXT, TEXT, TEXT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_reservation_v2(UUID, TEXT, TEXT, INT, TEXT, DATE) TO anon;
GRANT EXECUTE ON FUNCTION create_reservation_v2(UUID, TEXT, TEXT, INT, TEXT, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION create_reservation_v3(UUID, TEXT, TEXT, TEXT, INT, TEXT, DATE) TO anon;
GRANT EXECUTE ON FUNCTION create_reservation_v3(UUID, TEXT, TEXT, TEXT, INT, TEXT, DATE) TO authenticated;

-- ==========================================
-- Setup Complete
-- ==========================================

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS color_combos JSON NULL AFTER is_active;

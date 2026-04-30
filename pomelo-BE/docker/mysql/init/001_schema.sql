CREATE TABLE IF NOT EXISTS collections (
  id CHAR(36) PRIMARY KEY,
  slug VARCHAR(120) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  color_hex VARCHAR(20) NOT NULL,
  cover_image_url TEXT NOT NULL,
  description VARCHAR(400) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  display_order INT NOT NULL DEFAULT 100,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
  id CHAR(36) PRIMARY KEY,
  slug VARCHAR(120) NOT NULL UNIQUE,
  sku VARCHAR(80) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(80) NOT NULL,
  collection VARCHAR(80) NOT NULL,
  price_ars DECIMAL(10,2) NOT NULL,
  description TEXT NOT NULL,
  subtitle VARCHAR(255) NOT NULL,
  rating DECIMAL(3,2) NOT NULL DEFAULT 0,
  shipping_info VARCHAR(400) NOT NULL,
  fabric_care VARCHAR(400) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  color_combos JSON NULL,
  display_order INT NOT NULL DEFAULT 100,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS product_colors (
  id CHAR(36) PRIMARY KEY,
  product_id CHAR(36) NOT NULL,
  name VARCHAR(80) NOT NULL,
  hex VARCHAR(20) NOT NULL,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS product_sizes (
  id CHAR(36) PRIMARY KEY,
  product_id CHAR(36) NOT NULL,
  size_value VARCHAR(20) NOT NULL,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS product_images (
  id CHAR(36) PRIMARY KEY,
  product_id CHAR(36) NOT NULL,
  type VARCHAR(40) NOT NULL,
  url TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 1,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

INSERT INTO products (
  id, slug, sku, name, category, collection, price_ars, description, subtitle,
  rating, shipping_info, fabric_care, is_active, display_order, created_at, updated_at
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'remera-rib-algodon',
  'REM-001',
  'Remera Rib de Algodon',
  'Remeras',
  'Beige',
  42000,
  'Remera rib de algodon suave con corte limpio.',
  'Coleccion Beige',
  4.7,
  'Envio gratis superando ARS 120.000',
  '97% algodon, 3% elastano',
  1,
  1,
  NOW(),
  NOW()
) ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO product_colors (id, product_id, name, hex) VALUES
  ('21111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Marfil', '#efe9df'),
  ('31111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Arena', '#d8d1c4')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO product_sizes (id, product_id, size_value) VALUES
  ('41111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'S'),
  ('51111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'M'),
  ('61111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'L')
ON DUPLICATE KEY UPDATE size_value = VALUES(size_value);

INSERT INTO product_images (id, product_id, type, url, sort_order) VALUES
  ('71111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'thumbnail', 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80', 1),
  ('81111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'hover', 'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=900&q=80', 2),
  ('91111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'gallery', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80', 3)
ON DUPLICATE KEY UPDATE url = VALUES(url);

INSERT INTO collections (
  id, slug, name, color_hex, cover_image_url, description, is_active, display_order, created_at, updated_at
) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'amarillo', 'Amarillo', '#e4c84d', 'https://images.unsplash.com/photo-1513151233558-d860c5398176', 'Coleccion de remeras amarillas', 1, 1, NOW(), NOW()),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'azul', 'Azul', '#2f4f77', 'https://images.unsplash.com/photo-1475189778702-5ec9941484ae', 'Coleccion de remeras azules', 1, 2, NOW(), NOW()),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'marron', 'Marron', '#6f4e37', 'https://images.unsplash.com/photo-1506617420156-8e4536971650', 'Coleccion de remeras marrones', 1, 3, NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name);

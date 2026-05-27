CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  stock INTEGER NOT NULL,
  supplier VARCHAR(100),
  rating DECIMAL(2,1),
  sku VARCHAR(20),
  weight_kg DECIMAL(5,2),
  is_active BOOLEAN DEFAULT 1
);

INSERT INTO products VALUES (1, 'Laptop Pro', 'Electronics', 1299.99, 45, 'TechCorp', 4.5, 'ELEC-001', 2.10, 1);
INSERT INTO products VALUES (2, 'Wireless Mouse', 'Electronics', 29.99, 200, 'TechCorp', 4.2, 'ELEC-002', 0.12, 1);
INSERT INTO products VALUES (3, 'Office Chair', 'Furniture', 349.99, 30, 'ComfortPlus', 4.7, 'FURN-001', 15.50, 1);
INSERT INTO products VALUES (4, 'Desk Lamp', 'Furniture', 49.99, 120, 'BrightLight', 4.0, 'FURN-002', 1.80, 1);
INSERT INTO products VALUES (5, 'Notebook Set', 'Stationery', 15.99, 500, 'PaperWorld', 4.3, 'STAT-001', 0.45, 1);
INSERT INTO products VALUES (6, 'Mechanical Keyboard', 'Electronics', 149.99, 80, 'KeyMaster', 4.8, 'ELEC-003', 0.95, 1);
INSERT INTO products VALUES (7, 'Monitor 27"', 'Electronics', 499.99, 35, 'TechCorp', 4.6, 'ELEC-004', 6.20, 1);
INSERT INTO products VALUES (8, 'Standing Desk', 'Furniture', 599.99, 15, 'ComfortPlus', 4.4, 'FURN-003', 35.00, 1);
INSERT INTO products VALUES (9, 'Webcam HD', 'Electronics', 79.99, 150, 'TechCorp', 4.1, 'ELEC-005', 0.18, 1);
INSERT INTO products VALUES (10, 'Pen Set', 'Stationery', 24.99, 300, 'PaperWorld', 4.5, 'STAT-002', 0.15, 1);
INSERT INTO products VALUES (11, 'Headphones', 'Electronics', 199.99, 60, 'SoundMax', 4.7, 'ELEC-006', 0.35, 1);
INSERT INTO products VALUES (12, 'Bookshelf', 'Furniture', 189.99, 25, 'ComfortPlus', 4.2, 'FURN-004', 22.00, 1);
INSERT INTO products VALUES (13, 'USB Hub', 'Electronics', 39.99, 180, 'TechCorp', 4.0, 'ELEC-007', 0.08, 1);
INSERT INTO products VALUES (14, 'Whiteboard', 'Stationery', 89.99, 40, 'PaperWorld', 4.3, 'STAT-003', 3.50, 1);
INSERT INTO products VALUES (15, 'Ergonomic Mouse', 'Electronics', 69.99, 90, 'KeyMaster', 4.6, 'ELEC-008', 0.14, 1);
INSERT INTO products VALUES (16, 'Gaming Chair', 'Furniture', 449.99, 20, 'ComfortPlus', 4.5, 'FURN-005', 18.50, 1);
INSERT INTO products VALUES (17, 'Tablet 10"', 'Electronics', 399.99, 55, 'TechCorp', 4.4, 'ELEC-009', 0.48, 1);
INSERT INTO products VALUES (18, 'Printer Laser', 'Electronics', 299.99, 25, 'PrintMaster', 4.1, 'ELEC-010', 8.50, 1);
INSERT INTO products VALUES (19, 'File Organizer', 'Stationery', 34.99, 150, 'PaperWorld', 4.2, 'STAT-004', 0.60, 1);
INSERT INTO products VALUES (20, 'Coffee Table', 'Furniture', 279.99, 18, 'ComfortPlus', 4.3, 'FURN-006', 25.00, 1);
INSERT INTO products VALUES (21, 'External SSD 1TB', 'Electronics', 129.99, 100, 'TechCorp', 4.8, 'ELEC-011', 0.06, 1);
INSERT INTO products VALUES (22, 'Desk Organizer', 'Stationery', 42.99, 200, 'PaperWorld', 4.1, 'STAT-005', 0.75, 1);
INSERT INTO products VALUES (23, 'Smart Speaker', 'Electronics', 89.99, 70, 'SoundMax', 4.3, 'ELEC-012', 0.42, 1);
INSERT INTO products VALUES (24, 'Filing Cabinet', 'Furniture', 199.99, 12, 'ComfortPlus', 4.0, 'FURN-007', 28.00, 1);
INSERT INTO products VALUES (25, 'Marker Set', 'Stationery', 19.99, 400, 'PaperWorld', 4.4, 'STAT-006', 0.20, 1);
INSERT INTO products VALUES (26, 'USB-C Charger', 'Electronics', 49.99, 250, 'TechCorp', 4.5, 'ELEC-013', 0.15, 1);
INSERT INTO products VALUES (27, 'Bean Bag', 'Furniture', 129.99, 22, 'ComfortPlus', 4.6, 'FURN-008', 5.00, 0);
INSERT INTO products VALUES (28, 'Sticky Notes Pack', 'Stationery', 9.99, 600, 'PaperWorld', 4.2, 'STAT-007', 0.10, 1);
INSERT INTO products VALUES (29, 'Bluetooth Speaker', 'Electronics', 59.99, 110, 'SoundMax', 4.4, 'ELEC-014', 0.55, 1);
INSERT INTO products VALUES (30, 'Wall Clock', 'Furniture', 39.99, 45, 'BrightLight', 4.1, 'FURN-009', 0.80, 1);
INSERT INTO products VALUES (31, 'Laptop Stand', 'Electronics', 79.99, 85, 'KeyMaster', 4.7, 'ELEC-015', 1.20, 1);
INSERT INTO products VALUES (32, 'Planner 2024', 'Stationery', 22.99, 350, 'PaperWorld', 4.6, 'STAT-008', 0.35, 1);
INSERT INTO products VALUES (33, 'Desk Mat', 'Furniture', 29.99, 160, 'ComfortPlus', 4.3, 'FURN-010', 0.40, 1);
INSERT INTO products VALUES (34, 'Wireless Charger', 'Electronics', 34.99, 190, 'TechCorp', 4.2, 'ELEC-016', 0.10, 1);
INSERT INTO products VALUES (35, 'Scissors Set', 'Stationery', 12.99, 280, 'PaperWorld', 4.0, 'STAT-009', 0.25, 1);
INSERT INTO products VALUES (36, 'Room Divider', 'Furniture', 159.99, 8, 'ComfortPlus', 4.1, 'FURN-011', 12.00, 0);
INSERT INTO products VALUES (37, 'Power Bank 20000mAh', 'Electronics', 44.99, 140, 'TechCorp', 4.5, 'ELEC-017', 0.38, 1);
INSERT INTO products VALUES (38, 'Envelope Pack', 'Stationery', 7.99, 700, 'PaperWorld', 3.9, 'STAT-010', 0.30, 1);
INSERT INTO products VALUES (39, 'Noise-Cancel Buds', 'Electronics', 179.99, 50, 'SoundMax', 4.8, 'ELEC-018', 0.05, 1);
INSERT INTO products VALUES (40, 'Coat Rack', 'Furniture', 69.99, 30, 'ComfortPlus', 4.2, 'FURN-012', 4.50, 1);
INSERT INTO products VALUES (41, 'Drawing Tablet', 'Electronics', 249.99, 40, 'TechCorp', 4.6, 'ELEC-019', 0.65, 1);
INSERT INTO products VALUES (42, 'Paper Shredder', 'Stationery', 119.99, 20, 'PaperWorld', 4.1, 'STAT-011', 6.00, 1);
INSERT INTO products VALUES (43, 'LED Strip Lights', 'Electronics', 19.99, 300, 'BrightLight', 4.3, 'ELEC-020', 0.20, 1);
INSERT INTO products VALUES (44, 'Corner Desk', 'Furniture', 399.99, 10, 'ComfortPlus', 4.5, 'FURN-013', 30.00, 1);
INSERT INTO products VALUES (45, 'Stapler Heavy Duty', 'Stationery', 27.99, 180, 'PaperWorld', 4.4, 'STAT-012', 0.55, 1);
INSERT INTO products VALUES (46, 'HDMI Cable 2m', 'Electronics', 14.99, 400, 'TechCorp', 4.2, 'ELEC-021', 0.08, 1);
INSERT INTO products VALUES (47, 'Shoe Rack', 'Furniture', 49.99, 35, 'ComfortPlus', 4.0, 'FURN-014', 3.50, 1);
INSERT INTO products VALUES (48, 'Glue Gun Kit', 'Stationery', 16.99, 220, 'PaperWorld', 4.3, 'STAT-013', 0.30, 1);
INSERT INTO products VALUES (49, 'Portable Monitor', 'Electronics', 229.99, 30, 'TechCorp', 4.7, 'ELEC-022', 0.75, 1);
INSERT INTO products VALUES (50, 'Storage Ottoman', 'Furniture', 89.99, 28, 'ComfortPlus', 4.4, 'FURN-015', 7.00, 1);

CREATE TABLE IF NOT EXISTS sales (
  id INTEGER PRIMARY KEY,
  employee_id INTEGER,
  product_id INTEGER,
  sale_date DATE NOT NULL,
  quantity INTEGER NOT NULL,
  revenue DECIMAL(10,2) NOT NULL,
  region VARCHAR(20) NOT NULL,
  quarter CHAR(2),
  discount_pct DECIMAL(4,2) DEFAULT 0.00,
  channel VARCHAR(20),
  FOREIGN KEY (employee_id) REFERENCES employees(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

INSERT INTO sales VALUES (1, 1, 1, '2023-01-10', 2, 2599.98, 'East', 'Q1', 0.00, 'Online');
INSERT INTO sales VALUES (2, 3, 7, '2023-01-15', 1, 499.99, 'East', 'Q1', 5.00, 'Store');
INSERT INTO sales VALUES (3, 5, 6, '2023-01-22', 3, 449.97, 'East', 'Q1', 0.00, 'Online');
INSERT INTO sales VALUES (4, 8, 2, '2023-02-05', 10, 299.90, 'West', 'Q1', 0.00, 'Store');
INSERT INTO sales VALUES (5, 9, 11, '2023-02-14', 2, 399.98, 'East', 'Q1', 0.00, 'Online');
INSERT INTO sales VALUES (6, 4, 3, '2023-02-20', 1, 349.99, 'North', 'Q1', 10.00, 'Store');
INSERT INTO sales VALUES (7, 7, 8, '2023-03-01', 1, 599.99, 'North', 'Q1', 0.00, 'Online');
INSERT INTO sales VALUES (8, 2, 5, '2023-03-10', 20, 319.80, 'Central', 'Q1', 0.00, 'Store');
INSERT INTO sales VALUES (9, 10, 4, '2023-03-18', 5, 249.95, 'West', 'Q1', 0.00, 'Online');
INSERT INTO sales VALUES (10, 1, 1, '2023-04-05', 1, 1299.99, 'East', 'Q2', 0.00, 'Online');
INSERT INTO sales VALUES (11, 13, 6, '2023-04-12', 2, 299.98, 'East', 'Q2', 0.00, 'Store');
INSERT INTO sales VALUES (12, 5, 13, '2023-04-20', 8, 319.92, 'East', 'Q2', 0.00, 'Online');
INSERT INTO sales VALUES (13, 8, 9, '2023-05-01', 4, 319.96, 'West', 'Q2', 5.00, 'Store');
INSERT INTO sales VALUES (14, 11, 12, '2023-05-10', 2, 379.98, 'North', 'Q2', 0.00, 'Online');
INSERT INTO sales VALUES (15, 14, 10, '2023-05-15', 15, 374.85, 'West', 'Q2', 0.00, 'Store');
INSERT INTO sales VALUES (16, 3, 7, '2023-05-22', 1, 499.99, 'East', 'Q2', 0.00, 'Online');
INSERT INTO sales VALUES (17, 6, 14, '2023-06-01', 3, 269.97, 'Central', 'Q2', 0.00, 'Store');
INSERT INTO sales VALUES (18, 9, 15, '2023-06-10', 5, 349.95, 'East', 'Q2', 10.00, 'Online');
INSERT INTO sales VALUES (19, 12, 2, '2023-06-18', 12, 359.88, 'Central', 'Q2', 0.00, 'Store');
INSERT INTO sales VALUES (20, 7, 1, '2023-06-25', 1, 1299.99, 'North', 'Q2', 0.00, 'Online');
INSERT INTO sales VALUES (21, 1, 11, '2023-07-05', 3, 599.97, 'East', 'Q3', 0.00, 'Online');
INSERT INTO sales VALUES (22, 15, 3, '2023-07-12', 2, 699.98, 'North', 'Q3', 0.00, 'Store');
INSERT INTO sales VALUES (23, 10, 6, '2023-07-20', 1, 149.99, 'West', 'Q3', 5.00, 'Online');
INSERT INTO sales VALUES (24, 4, 8, '2023-08-01', 1, 599.99, 'North', 'Q3', 0.00, 'Store');
INSERT INTO sales VALUES (25, 13, 7, '2023-08-10', 2, 999.98, 'East', 'Q3', 0.00, 'Online');
INSERT INTO sales VALUES (26, 2, 4, '2023-08-18', 6, 299.94, 'Central', 'Q3', 0.00, 'Store');
INSERT INTO sales VALUES (27, 5, 9, '2023-09-01', 3, 239.97, 'East', 'Q3', 0.00, 'Online');
INSERT INTO sales VALUES (28, 8, 15, '2023-09-10', 4, 279.96, 'West', 'Q3', 10.00, 'Store');
INSERT INTO sales VALUES (29, 11, 1, '2023-09-20', 1, 1299.99, 'North', 'Q3', 0.00, 'Online');
INSERT INTO sales VALUES (30, 14, 5, '2023-09-28', 25, 399.75, 'West', 'Q3', 0.00, 'Store');
INSERT INTO sales VALUES (31, 16, 17, '2023-10-05', 2, 799.98, 'East', 'Q4', 0.00, 'Online');
INSERT INTO sales VALUES (32, 17, 21, '2023-10-10', 5, 649.95, 'West', 'Q4', 5.00, 'Store');
INSERT INTO sales VALUES (33, 18, 23, '2023-10-15', 3, 269.97, 'Central', 'Q4', 0.00, 'Online');
INSERT INTO sales VALUES (34, 19, 39, '2023-10-20', 4, 719.96, 'East', 'Q4', 0.00, 'Online');
INSERT INTO sales VALUES (35, 20, 31, '2023-10-25', 6, 479.94, 'North', 'Q4', 0.00, 'Store');
INSERT INTO sales VALUES (36, 21, 41, '2023-11-01', 1, 249.99, 'West', 'Q4', 10.00, 'Online');
INSERT INTO sales VALUES (37, 22, 49, '2023-11-05', 2, 459.98, 'East', 'Q4', 0.00, 'Store');
INSERT INTO sales VALUES (38, 23, 26, '2023-11-10', 8, 399.92, 'East', 'Q4', 0.00, 'Online');
INSERT INTO sales VALUES (39, 24, 34, '2023-11-15', 10, 349.90, 'North', 'Q4', 5.00, 'Store');
INSERT INTO sales VALUES (40, 25, 43, '2023-11-20', 15, 299.85, 'West', 'Q4', 0.00, 'Online');
INSERT INTO sales VALUES (41, 26, 37, '2023-11-25', 3, 134.97, 'Central', 'Q4', 0.00, 'Store');
INSERT INTO sales VALUES (42, 27, 46, '2023-12-01', 20, 299.80, 'East', 'Q4', 0.00, 'Online');
INSERT INTO sales VALUES (43, 28, 18, '2023-12-05', 1, 299.99, 'North', 'Q4', 0.00, 'Store');
INSERT INTO sales VALUES (44, 29, 29, '2023-12-10', 4, 239.96, 'Central', 'Q4', 10.00, 'Online');
INSERT INTO sales VALUES (45, 30, 11, '2023-12-12', 2, 399.98, 'West', 'Q4', 0.00, 'Store');
INSERT INTO sales VALUES (46, 31, 16, '2023-12-15', 1, 449.99, 'East', 'Q4', 0.00, 'Online');
INSERT INTO sales VALUES (47, 32, 44, '2023-12-18', 1, 399.99, 'North', 'Q4', 5.00, 'Store');
INSERT INTO sales VALUES (48, 33, 7, '2023-12-20', 1, 499.99, 'West', 'Q4', 0.00, 'Online');
INSERT INTO sales VALUES (49, 34, 3, '2023-12-23', 1, 349.99, 'Central', 'Q4', 0.00, 'Store');
INSERT INTO sales VALUES (50, 35, 1, '2023-12-28', 1, 1299.99, 'East', 'Q4', 0.00, 'Online');

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY,
  customer_id INTEGER,
  product_id INTEGER,
  quantity INTEGER NOT NULL,
  order_date DATE NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) NOT NULL,
  payment_method VARCHAR(30),
  shipping_address VARCHAR(200),
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

INSERT INTO orders VALUES (1, 1, 1, 1, '2023-01-15', 1299.99, 'Delivered', 'Credit Card', 'Los Angeles, USA');
INSERT INTO orders VALUES (2, 2, 6, 2, '2023-01-20', 299.98, 'Delivered', 'PayPal', 'London, UK');
INSERT INTO orders VALUES (3, 1, 3, 1, '2023-02-05', 349.99, 'Delivered', 'Credit Card', 'Los Angeles, USA');
INSERT INTO orders VALUES (4, 3, 2, 3, '2023-02-10', 89.97, 'Shipped', 'Debit Card', 'Madrid, Spain');
INSERT INTO orders VALUES (5, 4, 7, 1, '2023-02-14', 499.99, 'Delivered', 'Credit Card', 'Tokyo, Japan');
INSERT INTO orders VALUES (6, 5, 11, 1, '2023-03-01', 199.99, 'Delivered', 'Bank Transfer', 'Berlin, Germany');
INSERT INTO orders VALUES (7, 2, 8, 1, '2023-03-12', 599.99, 'Shipped', 'PayPal', 'London, UK');
INSERT INTO orders VALUES (8, 6, 5, 5, '2023-03-15', 79.95, 'Pending', 'Credit Card', 'New York, USA');
INSERT INTO orders VALUES (9, 7, 1, 1, '2023-03-20', 1299.99, 'Delivered', 'Credit Card', 'Paris, France');
INSERT INTO orders VALUES (10, 1, 9, 2, '2023-04-01', 159.98, 'Delivered', 'Debit Card', 'Los Angeles, USA');
INSERT INTO orders VALUES (11, 8, 4, 3, '2023-04-10', 149.97, 'Shipped', 'Credit Card', 'Beijing, China');
INSERT INTO orders VALUES (12, 3, 6, 1, '2023-04-15', 149.99, 'Cancelled', 'PayPal', 'Madrid, Spain');
INSERT INTO orders VALUES (13, 9, 12, 1, '2023-04-22', 189.99, 'Delivered', 'Bank Transfer', 'Warsaw, Poland');
INSERT INTO orders VALUES (14, 10, 10, 4, '2023-05-01', 99.96, 'Pending', 'Debit Card', 'São Paulo, Brazil');
INSERT INTO orders VALUES (15, 4, 15, 2, '2023-05-10', 139.98, 'Delivered', 'Credit Card', 'Tokyo, Japan');
INSERT INTO orders VALUES (16, 11, 1, 1, '2023-05-15', 1299.99, 'Delivered', 'PayPal', 'Chicago, USA');
INSERT INTO orders VALUES (17, 5, 3, 2, '2023-05-20', 699.98, 'Shipped', 'Bank Transfer', 'Berlin, Germany');
INSERT INTO orders VALUES (18, 12, 13, 3, '2023-06-01', 119.97, 'Pending', 'Credit Card', 'London, UK');
INSERT INTO orders VALUES (19, 6, 7, 1, '2023-06-10', 499.99, 'Delivered', 'Debit Card', 'New York, USA');
INSERT INTO orders VALUES (20, 2, 14, 1, '2023-06-15', 89.99, 'Delivered', 'PayPal', 'London, UK');
INSERT INTO orders VALUES (21, 7, 11, 1, '2023-06-20', 199.99, 'Cancelled', 'Credit Card', 'Paris, France');
INSERT INTO orders VALUES (22, 9, 2, 2, '2023-07-01', 59.98, 'Delivered', 'Bank Transfer', 'Warsaw, Poland');
INSERT INTO orders VALUES (23, 1, 6, 1, '2023-07-10', 149.99, 'Delivered', 'Credit Card', 'Los Angeles, USA');
INSERT INTO orders VALUES (24, 10, 8, 1, '2023-07-15', 599.99, 'Shipped', 'Debit Card', 'São Paulo, Brazil');
INSERT INTO orders VALUES (25, 3, 9, 1, '2023-07-20', 79.99, 'Delivered', 'PayPal', 'Madrid, Spain');
INSERT INTO orders VALUES (26, 13, 17, 1, '2023-07-25', 399.99, 'Delivered', 'Credit Card', 'Mumbai, India');
INSERT INTO orders VALUES (27, 14, 21, 2, '2023-08-01', 259.98, 'Delivered', 'Debit Card', 'Rome, Italy');
INSERT INTO orders VALUES (28, 15, 16, 1, '2023-08-05', 449.99, 'Shipped', 'PayPal', 'Mexico City, Mexico');
INSERT INTO orders VALUES (29, 16, 23, 1, '2023-08-10', 89.99, 'Delivered', 'Credit Card', 'Seoul, South Korea');
INSERT INTO orders VALUES (30, 17, 39, 1, '2023-08-15', 179.99, 'Delivered', 'Bank Transfer', 'Sydney, Australia');
INSERT INTO orders VALUES (31, 18, 29, 2, '2023-08-20', 119.98, 'Pending', 'Debit Card', 'Cairo, Egypt');
INSERT INTO orders VALUES (32, 19, 41, 1, '2023-08-25', 249.99, 'Delivered', 'Credit Card', 'Moscow, Russia');
INSERT INTO orders VALUES (33, 20, 31, 1, '2023-09-01', 79.99, 'Delivered', 'PayPal', 'Toronto, Canada');
INSERT INTO orders VALUES (34, 21, 34, 3, '2023-09-05', 104.97, 'Shipped', 'Credit Card', 'Shanghai, China');
INSERT INTO orders VALUES (35, 22, 43, 5, '2023-09-10', 99.95, 'Delivered', 'Bank Transfer', 'Stockholm, Sweden');
INSERT INTO orders VALUES (36, 23, 49, 1, '2023-09-15', 229.99, 'Delivered', 'Debit Card', 'Delhi, India');
INSERT INTO orders VALUES (37, 24, 1, 1, '2023-09-20', 1299.99, 'Delivered', 'Credit Card', 'Dublin, Ireland');
INSERT INTO orders VALUES (38, 25, 37, 2, '2023-09-25', 89.98, 'Pending', 'PayPal', 'Osaka, Japan');
INSERT INTO orders VALUES (39, 26, 18, 1, '2023-10-01', 299.99, 'Delivered', 'Credit Card', 'Houston, USA');
INSERT INTO orders VALUES (40, 27, 46, 4, '2023-10-05', 59.96, 'Delivered', 'Bank Transfer', 'Munich, Germany');
INSERT INTO orders VALUES (41, 28, 11, 1, '2023-10-10', 199.99, 'Shipped', 'Debit Card', 'Prague, Czech Republic');
INSERT INTO orders VALUES (42, 29, 7, 2, '2023-10-15', 999.98, 'Delivered', 'Credit Card', 'Hong Kong, China');
INSERT INTO orders VALUES (43, 30, 26, 3, '2023-10-20', 149.97, 'Delivered', 'PayPal', 'Barcelona, Spain');
INSERT INTO orders VALUES (44, 31, 5, 10, '2023-10-25', 159.90, 'Pending', 'Credit Card', 'Busan, South Korea');
INSERT INTO orders VALUES (45, 32, 44, 1, '2023-11-01', 399.99, 'Delivered', 'Bank Transfer', 'Dubai, UAE');
INSERT INTO orders VALUES (46, 33, 15, 2, '2023-11-05', 139.98, 'Delivered', 'Debit Card', 'Miami, USA');
INSERT INTO orders VALUES (47, 34, 8, 1, '2023-11-10', 599.99, 'Delivered', 'Credit Card', 'Boston, USA');
INSERT INTO orders VALUES (48, 35, 22, 4, '2023-11-15', 171.96, 'Shipped', 'PayPal', 'Bucharest, Romania');
INSERT INTO orders VALUES (49, 36, 33, 2, '2023-11-20', 59.98, 'Delivered', 'Bank Transfer', 'Gothenburg, Sweden');
INSERT INTO orders VALUES (50, 37, 21, 1, '2023-11-25', 129.99, 'Delivered', 'Credit Card', 'Riyadh, Saudi Arabia');

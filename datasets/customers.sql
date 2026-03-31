CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100),
  city VARCHAR(50),
  country VARCHAR(50),
  signup_date DATE,
  loyalty_tier VARCHAR(20),
  phone VARCHAR(20),
  age INTEGER,
  gender CHAR(1),
  total_spent DECIMAL(10,2) DEFAULT 0.00
);

INSERT INTO customers VALUES (1, 'Sarah Connor', 'sarah@email.com', 'Los Angeles', 'USA', '2020-01-10', 'Gold', '+1-310-555-0201', 34, 'F', 4250.50);
INSERT INTO customers VALUES (2, 'James Bond', 'james@email.com', 'London', 'UK', '2019-05-15', 'Platinum', '+44-20-555-0202', 45, 'M', 12340.00);
INSERT INTO customers VALUES (3, 'Maria Garcia', 'maria@email.com', 'Madrid', 'Spain', '2021-03-22', 'Silver', '+34-91-555-0203', 29, 'F', 1580.75);
INSERT INTO customers VALUES (4, 'Yuki Tanaka', 'yuki@email.com', 'Tokyo', 'Japan', '2020-08-30', 'Gold', '+81-3-555-0204', 31, 'F', 5620.00);
INSERT INTO customers VALUES (5, 'Hans Mueller', 'hans@email.com', 'Berlin', 'Germany', '2019-11-05', 'Platinum', '+49-30-555-0205', 52, 'M', 15890.25);
INSERT INTO customers VALUES (6, 'Emily Watson', 'emily@email.com', 'New York', 'USA', '2021-06-18', 'Silver', '+1-212-555-0206', 27, 'F', 980.50);
INSERT INTO customers VALUES (7, 'Pierre Dupont', 'pierre@email.com', 'Paris', 'France', '2020-04-12', 'Gold', '+33-1-555-0207', 38, 'M', 6780.00);
INSERT INTO customers VALUES (8, 'Li Wei', 'li@email.com', 'Beijing', 'China', '2022-01-25', 'Silver', '+86-10-555-0208', 33, 'M', 2340.75);
INSERT INTO customers VALUES (9, 'Anna Kowalski', 'anna@email.com', 'Warsaw', 'Poland', '2021-09-08', 'Gold', '+48-22-555-0209', 41, 'F', 4890.00);
INSERT INTO customers VALUES (10, 'Carlos Silva', 'carlos@email.com', 'São Paulo', 'Brazil', '2020-12-14', 'Silver', '+55-11-555-0210', 36, 'M', 1750.50);
INSERT INTO customers VALUES (11, 'Rachel Green', 'rachel@email.com', 'Chicago', 'USA', '2019-07-20', 'Platinum', '+1-312-555-0211', 30, 'F', 18920.00);
INSERT INTO customers VALUES (12, 'Tom Hardy', 'tom@email.com', 'London', 'UK', '2022-05-01', 'Silver', '+44-20-555-0212', 40, 'M', 890.25);
INSERT INTO customers VALUES (13, 'Aisha Patel', 'aisha@email.com', 'Mumbai', 'India', '2020-02-28', 'Gold', '+91-22-555-0213', 28, 'F', 7230.00);
INSERT INTO customers VALUES (14, 'Marco Rossi', 'marco@email.com', 'Rome', 'Italy', '2021-11-15', 'Silver', '+39-06-555-0214', 47, 'M', 2100.50);
INSERT INTO customers VALUES (15, 'Sofia Hernandez', 'sofia@email.com', 'Mexico City', 'Mexico', '2019-09-03', 'Gold', '+52-55-555-0215', 35, 'F', 5430.75);
INSERT INTO customers VALUES (16, 'David Kim', 'david@email.com', 'Seoul', 'South Korea', '2022-03-10', 'Silver', '+82-2-555-0216', 26, 'M', 1120.00);
INSERT INTO customers VALUES (17, 'Emma Wilson', 'emma.w@email.com', 'Sydney', 'Australia', '2020-07-22', 'Platinum', '+61-2-555-0217', 39, 'F', 14560.25);
INSERT INTO customers VALUES (18, 'Ahmed Hassan', 'ahmed@email.com', 'Cairo', 'Egypt', '2021-04-05', 'Silver', '+20-2-555-0218', 44, 'M', 1890.00);
INSERT INTO customers VALUES (19, 'Nina Petrova', 'nina@email.com', 'Moscow', 'Russia', '2019-12-20', 'Gold', '+7-495-555-0219', 32, 'F', 8120.50);
INSERT INTO customers VALUES (20, 'Jake Thompson', 'jake@email.com', 'Toronto', 'Canada', '2020-10-08', 'Gold', '+1-416-555-0220', 37, 'M', 6340.00);
INSERT INTO customers VALUES (21, 'Lina Chen', 'lina@email.com', 'Shanghai', 'China', '2021-01-30', 'Silver', '+86-21-555-0221', 25, 'F', 1560.75);
INSERT INTO customers VALUES (22, 'Oscar Lindberg', 'oscar@email.com', 'Stockholm', 'Sweden', '2022-07-12', 'Silver', '+46-8-555-0222', 42, 'M', 780.00);
INSERT INTO customers VALUES (23, 'Priya Sharma', 'priya@email.com', 'Delhi', 'India', '2020-05-18', 'Gold', '+91-11-555-0223', 29, 'F', 5190.25);
INSERT INTO customers VALUES (24, 'Ryan O''Brien', 'ryan@email.com', 'Dublin', 'Ireland', '2019-08-25', 'Platinum', '+353-1-555-0224', 48, 'M', 16780.50);
INSERT INTO customers VALUES (25, 'Sakura Yamamoto', 'sakura@email.com', 'Osaka', 'Japan', '2021-02-14', 'Gold', '+81-6-555-0225', 27, 'F', 4560.00);
INSERT INTO customers VALUES (26, 'Thomas Brown', 'thomas@email.com', 'Houston', 'USA', '2020-09-30', 'Silver', '+1-713-555-0226', 50, 'M', 2890.75);
INSERT INTO customers VALUES (27, 'Ursula Schmidt', 'ursula@email.com', 'Munich', 'Germany', '2022-06-05', 'Silver', '+49-89-555-0227', 34, 'F', 1230.00);
INSERT INTO customers VALUES (28, 'Viktor Novak', 'viktor@email.com', 'Prague', 'Czech Republic', '2021-08-20', 'Gold', '+420-2-555-0228', 43, 'M', 6890.25);
INSERT INTO customers VALUES (29, 'Wendy Zhang', 'wendy@email.com', 'Hong Kong', 'China', '2019-03-15', 'Platinum', '+852-555-0229', 36, 'F', 21340.50);
INSERT INTO customers VALUES (30, 'Xavier Lopez', 'xavier@email.com', 'Barcelona', 'Spain', '2020-11-28', 'Gold', '+34-93-555-0230', 31, 'M', 5670.00);
INSERT INTO customers VALUES (31, 'Yuna Park', 'yuna@email.com', 'Busan', 'South Korea', '2022-02-10', 'Silver', '+82-51-555-0231', 24, 'F', 950.75);
INSERT INTO customers VALUES (32, 'Zain Ali', 'zain@email.com', 'Dubai', 'UAE', '2021-05-25', 'Gold', '+971-4-555-0232', 40, 'M', 8450.00);
INSERT INTO customers VALUES (33, 'Bella Martinez', 'bella@email.com', 'Miami', 'USA', '2020-03-07', 'Silver', '+1-305-555-0233', 28, 'F', 2340.25);
INSERT INTO customers VALUES (34, 'Chris Evans', 'chris@email.com', 'Boston', 'USA', '2019-06-14', 'Platinum', '+1-617-555-0234', 46, 'M', 19560.50);
INSERT INTO customers VALUES (35, 'Diana Popescu', 'diana.p@email.com', 'Bucharest', 'Romania', '2021-10-02', 'Silver', '+40-21-555-0235', 33, 'F', 1680.00);
INSERT INTO customers VALUES (36, 'Erik Johansson', 'erik@email.com', 'Gothenburg', 'Sweden', '2022-08-18', 'Silver', '+46-31-555-0236', 38, 'M', 670.75);
INSERT INTO customers VALUES (37, 'Fatima Al-Rashidi', 'fatima@email.com', 'Riyadh', 'Saudi Arabia', '2020-06-30', 'Gold', '+966-11-555-0237', 30, 'F', 7890.00);
INSERT INTO customers VALUES (38, 'George Papadopoulos', 'george@email.com', 'Athens', 'Greece', '2021-12-12', 'Silver', '+30-21-555-0238', 51, 'M', 1450.25);
INSERT INTO customers VALUES (39, 'Hannah O''Connor', 'hannah@email.com', 'Cork', 'Ireland', '2019-02-08', 'Gold', '+353-21-555-0239', 35, 'F', 6120.50);
INSERT INTO customers VALUES (40, 'Ivan Volkov', 'ivan@email.com', 'St. Petersburg', 'Russia', '2020-08-15', 'Silver', '+7-812-555-0240', 44, 'M', 2560.00);
INSERT INTO customers VALUES (41, 'Julia Andersson', 'julia@email.com', 'Malmö', 'Sweden', '2022-04-22', 'Silver', '+46-40-555-0241', 26, 'F', 890.75);
INSERT INTO customers VALUES (42, 'Kevin Nguyen', 'kevin@email.com', 'Ho Chi Minh', 'Vietnam', '2021-07-05', 'Gold', '+84-28-555-0242', 32, 'M', 4230.00);
INSERT INTO customers VALUES (43, 'Laura Bianchi', 'laura@email.com', 'Milan', 'Italy', '2020-01-28', 'Gold', '+39-02-555-0243', 37, 'F', 5890.25);
INSERT INTO customers VALUES (44, 'Mohamed El-Sayed', 'mohamed@email.com', 'Alexandria', 'Egypt', '2019-10-16', 'Platinum', '+20-3-555-0244', 49, 'M', 13450.50);
INSERT INTO customers VALUES (45, 'Natasha Sokolova', 'natasha@email.com', 'Kiev', 'Ukraine', '2021-03-12', 'Silver', '+380-44-555-0245', 29, 'F', 1780.00);
INSERT INTO customers VALUES (46, 'Oliver Smith', 'oliver@email.com', 'San Francisco', 'USA', '2022-09-01', 'Silver', '+1-415-555-0246', 41, 'M', 560.75);
INSERT INTO customers VALUES (47, 'Patricia Costa', 'patricia@email.com', 'Lisbon', 'Portugal', '2020-04-20', 'Gold', '+351-21-555-0247', 34, 'F', 6780.00);
INSERT INTO customers VALUES (48, 'Raj Gupta', 'raj@email.com', 'Bangalore', 'India', '2019-11-30', 'Platinum', '+91-80-555-0248', 39, 'M', 17890.25);
INSERT INTO customers VALUES (49, 'Sophia Lee', 'sophia.l@email.com', 'Singapore', 'Singapore', '2021-06-08', 'Gold', '+65-555-0249', 27, 'F', 5340.50);
INSERT INTO customers VALUES (50, 'Tariq Khan', 'tariq@email.com', 'Lahore', 'Pakistan', '2020-12-25', 'Silver', '+92-42-555-0250', 45, 'M', 2120.00);

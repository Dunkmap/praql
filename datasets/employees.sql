CREATE TABLE IF NOT EXISTS employees (
  id INTEGER PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  department VARCHAR(50) NOT NULL,
  salary DECIMAL(10,2) NOT NULL,
  hire_date DATE,
  manager_id INTEGER,
  age INTEGER,
  city VARCHAR(50),
  email VARCHAR(100),
  phone VARCHAR(20),
  status VARCHAR(20) DEFAULT 'Active'
);

INSERT INTO employees VALUES (1, 'John Smith', 'IT', 6000.00, '2020-01-15', NULL, 35, 'New York', 'john@company.com', '+1-212-555-0101', 'Active');
INSERT INTO employees VALUES (2, 'Alice Johnson', 'HR', 4500.00, '2019-06-20', 1, 28, 'Chicago', 'alice@company.com', '+1-312-555-0102', 'Active');
INSERT INTO employees VALUES (3, 'Bob Williams', 'IT', 7000.00, '2018-03-10', 1, 42, 'New York', 'bob@company.com', '+1-212-555-0103', 'Active');
INSERT INTO employees VALUES (4, 'Emma Davis', 'Finance', 5000.00, '2021-09-01', NULL, 31, 'Boston', 'emma@company.com', '+1-617-555-0104', 'Active');
INSERT INTO employees VALUES (5, 'Charlie Brown', 'IT', 5500.00, '2020-11-25', 3, 26, 'New York', 'charlie@company.com', '+1-212-555-0105', 'Active');
INSERT INTO employees VALUES (6, 'Diana Prince', 'HR', 4800.00, '2022-02-14', 2, 29, 'Chicago', 'diana@company.com', '+1-312-555-0106', 'Active');
INSERT INTO employees VALUES (7, 'Frank Castle', 'Finance', 6200.00, '2019-07-30', 4, 38, 'Boston', 'frank@company.com', '+1-617-555-0107', 'Active');
INSERT INTO employees VALUES (8, 'Grace Lee', 'Marketing', 5200.00, '2021-04-18', NULL, 33, 'Seattle', 'grace@company.com', '+1-206-555-0108', 'Active');
INSERT INTO employees VALUES (9, 'Henry Ford', 'IT', 7500.00, '2017-12-01', 1, 45, 'New York', 'henry@company.com', '+1-212-555-0109', 'Active');
INSERT INTO employees VALUES (10, 'Ivy Chen', 'Marketing', 4900.00, '2022-08-10', 8, 27, 'Seattle', 'ivy@company.com', '+1-206-555-0110', 'Active');
INSERT INTO employees VALUES (11, 'Jack Wilson', 'Finance', 5800.00, '2020-05-22', 4, 36, 'Boston', 'jack@company.com', '+1-617-555-0111', 'Active');
INSERT INTO employees VALUES (12, 'Karen White', 'HR', 5100.00, '2021-01-07', 2, 30, 'Chicago', 'karen@company.com', '+1-312-555-0112', 'Active');
INSERT INTO employees VALUES (13, 'Leo Martin', 'IT', 6500.00, '2019-09-15', 3, 40, 'New York', 'leo@company.com', '+1-212-555-0113', 'Active');
INSERT INTO employees VALUES (14, 'Mia Taylor', 'Marketing', 4700.00, '2022-11-03', 8, 25, 'Seattle', 'mia@company.com', '+1-206-555-0114', 'Active');
INSERT INTO employees VALUES (15, 'Nathan Scott', 'Finance', 5400.00, '2021-06-28', 7, 34, 'Boston', 'nathan@company.com', '+1-617-555-0115', 'Active');
INSERT INTO employees VALUES (16, 'Olivia Brown', 'IT', 6800.00, '2018-08-12', 3, 39, 'New York', 'olivia@company.com', '+1-212-555-0116', 'Active');
INSERT INTO employees VALUES (17, 'Peter Parker', 'Marketing', 5300.00, '2020-03-05', 8, 24, 'Seattle', 'peter@company.com', '+1-206-555-0117', 'Active');
INSERT INTO employees VALUES (18, 'Quinn Adams', 'HR', 4600.00, '2022-05-20', 2, 26, 'Chicago', 'quinn@company.com', '+1-312-555-0118', 'Active');
INSERT INTO employees VALUES (19, 'Ryan Moore', 'Finance', 5900.00, '2019-10-14', 4, 37, 'Boston', 'ryan@company.com', '+1-617-555-0119', 'Active');
INSERT INTO employees VALUES (20, 'Sophia Kim', 'IT', 7200.00, '2017-05-30', 1, 43, 'New York', 'sophia@company.com', '+1-212-555-0120', 'Active');
INSERT INTO employees VALUES (21, 'Tyler James', 'Marketing', 4800.00, '2021-12-01', 8, 28, 'Seattle', 'tyler@company.com', '+1-206-555-0121', 'Active');
INSERT INTO employees VALUES (22, 'Uma Patel', 'HR', 5200.00, '2020-07-15', 2, 32, 'Chicago', 'uma@company.com', '+1-312-555-0122', 'Active');
INSERT INTO employees VALUES (23, 'Victor Hugo', 'IT', 6100.00, '2021-02-28', 3, 29, 'New York', 'victor@company.com', '+1-212-555-0123', 'Active');
INSERT INTO employees VALUES (24, 'Wendy Clark', 'Finance', 5100.00, '2022-04-10', 7, 27, 'Boston', 'wendy@company.com', '+1-617-555-0124', 'Active');
INSERT INTO employees VALUES (25, 'Xander Cruz', 'Marketing', 5000.00, '2020-09-08', 8, 31, 'Seattle', 'xander@company.com', '+1-206-555-0125', 'Inactive');
INSERT INTO employees VALUES (26, 'Yara Singh', 'HR', 4900.00, '2019-04-22', 2, 35, 'Chicago', 'yara@company.com', '+1-312-555-0126', 'Active');
INSERT INTO employees VALUES (27, 'Zack Miller', 'IT', 6400.00, '2018-11-17', 9, 41, 'New York', 'zack@company.com', '+1-212-555-0127', 'Active');
INSERT INTO employees VALUES (28, 'Amy Roberts', 'Finance', 5600.00, '2021-08-05', 4, 33, 'Boston', 'amy@company.com', '+1-617-555-0128', 'Active');
INSERT INTO employees VALUES (29, 'Brian Hall', 'Marketing', 5100.00, '2022-01-19', 8, 30, 'Seattle', 'brian@company.com', '+1-206-555-0129', 'Active');
INSERT INTO employees VALUES (30, 'Cathy Young', 'HR', 4700.00, '2020-06-11', 6, 28, 'Chicago', 'cathy@company.com', '+1-312-555-0130', 'Inactive');
INSERT INTO employees VALUES (31, 'Daniel King', 'IT', 7100.00, '2017-09-25', 1, 44, 'New York', 'daniel@company.com', '+1-212-555-0131', 'Active');
INSERT INTO employees VALUES (32, 'Elena Wright', 'Finance', 5300.00, '2019-12-03', 7, 36, 'Boston', 'elena@company.com', '+1-617-555-0132', 'Active');
INSERT INTO employees VALUES (33, 'Felix Green', 'Marketing', 4600.00, '2022-09-14', 8, 23, 'Seattle', 'felix@company.com', '+1-206-555-0133', 'Active');
INSERT INTO employees VALUES (34, 'Gina Baker', 'HR', 5000.00, '2021-03-30', 2, 31, 'Chicago', 'gina@company.com', '+1-312-555-0134', 'Active');
INSERT INTO employees VALUES (35, 'Harry Nelson', 'IT', 6700.00, '2018-06-18', 3, 38, 'New York', 'harry@company.com', '+1-212-555-0135', 'Active');
INSERT INTO employees VALUES (36, 'Isabel Carter', 'Finance', 5500.00, '2020-02-25', 4, 34, 'Boston', 'isabel@company.com', '+1-617-555-0136', 'Active');
INSERT INTO employees VALUES (37, 'Jason Mitchell', 'Marketing', 4900.00, '2021-07-08', 8, 29, 'Seattle', 'jason@company.com', '+1-206-555-0137', 'Active');
INSERT INTO employees VALUES (38, 'Kate Perez', 'HR', 5300.00, '2019-01-12', 2, 33, 'Chicago', 'kate@company.com', '+1-312-555-0138', 'Active');
INSERT INTO employees VALUES (39, 'Liam Roberts', 'IT', 6900.00, '2017-04-06', 9, 46, 'New York', 'liam@company.com', '+1-212-555-0139', 'Active');
INSERT INTO employees VALUES (40, 'Monica Evans', 'Finance', 5200.00, '2022-06-22', 7, 26, 'Boston', 'monica@company.com', '+1-617-555-0140', 'Active');
INSERT INTO employees VALUES (41, 'Noah Turner', 'Marketing', 5400.00, '2020-10-30', 8, 32, 'Seattle', 'noah@company.com', '+1-206-555-0141', 'Active');
INSERT INTO employees VALUES (42, 'Olga Phillips', 'HR', 4800.00, '2021-05-14', 6, 30, 'Chicago', 'olga@company.com', '+1-312-555-0142', 'Inactive');
INSERT INTO employees VALUES (43, 'Paul Campbell', 'IT', 6300.00, '2019-08-28', 3, 40, 'New York', 'paul@company.com', '+1-212-555-0143', 'Active');
INSERT INTO employees VALUES (44, 'Rita Parker', 'Finance', 5700.00, '2018-02-09', 4, 37, 'Boston', 'rita@company.com', '+1-617-555-0144', 'Active');
INSERT INTO employees VALUES (45, 'Samuel Edwards', 'Marketing', 4700.00, '2022-03-17', 8, 25, 'Seattle', 'samuel@company.com', '+1-206-555-0145', 'Active');
INSERT INTO employees VALUES (46, 'Tina Collins', 'HR', 5100.00, '2020-08-02', 2, 34, 'Chicago', 'tina@company.com', '+1-312-555-0146', 'Active');
INSERT INTO employees VALUES (47, 'Umar Stewart', 'IT', 6600.00, '2019-03-21', 9, 39, 'New York', 'umar@company.com', '+1-212-555-0147', 'Active');
INSERT INTO employees VALUES (48, 'Vera Sanchez', 'Finance', 5400.00, '2021-11-08', 7, 28, 'Boston', 'vera@company.com', '+1-617-555-0148', 'Active');
INSERT INTO employees VALUES (49, 'William Morris', 'Marketing', 5200.00, '2020-04-25', 8, 35, 'Seattle', 'william@company.com', '+1-206-555-0149', 'Active');
INSERT INTO employees VALUES (50, 'Zoe Rogers', 'IT', 7800.00, '2016-12-15', 1, 48, 'New York', 'zoe@company.com', '+1-212-555-0150', 'Active');

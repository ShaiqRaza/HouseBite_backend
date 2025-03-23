INSERT INTO Users (name, phone, email, password, address, latitude, longitude)
VALUES 
('shaiq', 03004535787, 'heyshaiq@gmail.com', 123, 'lahore', 77.8, 69.5),
('khusham', 03004675787, 'h07hhaiq@gmail.com', 121, 'lahore', 80.8, 79.5),
('ubaid', 03089535787, 'kkojom@gmail.com', 122, 'lahore', 79.8, 79.5),
('ahmad', 03004535997, 'jnio@gmail.com', 124, 'lahore', 71.8, 79.5),
('zahid', 03004500787, 'njhn8@gmail.com', 125, 'lahore', 79.8, 70.5),
('sheraz', 03114535787, 'nn8h@gmail.com', 126, 'lahore', 29.8, 59.5);

INSERT INTO plans (name, kitchen_id, price, description) VALUES
('Basic Breakfast Plan', 1, 200, 'Healthy breakfast plan with fresh ingredients'),
('Standard Breakfast Plan', 1, 500, 'Delicious lunch with balanced nutrients'),
('Good Lunch Plan', 1, 800, 'Luxury dinner with high-quality meals'),
('Premium Lunch Plan', 2, 800, 'Luxury dinner with high-quality meals'),
('Premium Dinner Plan', 2, 800, 'Luxury dinner with high-quality meals'),
('Premium Dinner Plan', 1, 800, 'Luxury dinner with high-quality meals');

INSERT INTO meals (plan_id, name, price) VALUES
(2, 'Pancakes with Honey', 250),
(2, 'Omelette with Toast', 200),
(2, 'Grilled Chicken with Rice', 600),
(2, 'Vegetable Pasta', 450),
(3, 'Steak with Mashed Potatoes', 900),
(3, 'Salmon with Vegetables', 850),
(4, 'Omelette with Toast', 200),
(4, 'Grilled Chicken with Rice', 600),
(4, 'Vegetable Pasta', 450),
(5, 'Steak with Mashed Potatoes', 900),
(6, 'Salmon with Vegetables', 850);

INSERT INTO meal_days (meal_id, day, timing) VALUES
(11, 'Monday', '08:00:00'),
(13, 'Wednesday', '08:00:00'),
(12, 'Tuesday', '08:00:00'),
(12, 'Thursday', '08:00:00'),
(13, 'Monday', '08:00:00'),
(13, 'Friday', '08:00:00'),
(14, 'Tuesday', '08:00:00'),
(14, 'Saturday', '08:00:00'),
(5, 'Sunday', '08:00:00'),
(6, 'Thursday', '08:00:00'),
(7, 'Thursday', '08:00:00'),
(8, 'Friday', '08:00:00'),
(11, 'Tuesday', '08:00:00'),
(10, 'Saturday', '08:00:00'),
(10, 'Sunday', '08:00:00'),
(10, 'Thursday', '08:00:00');

insert into Subscriptions (user_id, plan_id, persons, price, type, end_date)
values
(1, 2, 5, 15000, 'weekly', '12-8-2025'),
(2, 3, 5, 15000, 'weekly', '12-8-2025'),
(3, 2, 5, 50000, 'monthly', '12-23-2025'),
(4, 5, 1, 5000, 'monthly', '12-23-2025')

select * from meals
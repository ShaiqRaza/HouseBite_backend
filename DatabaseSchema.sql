-- Database Creation
CREATE DATABASE HouseBite;
GO
USE HouseBite;


CREATE TABLE Users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(100) NOT NULL, -- can be same for multiple accounts
    email VARCHAR(255) NOT NULL CONSTRAINT UQ_Users_Email UNIQUE, 
    CONSTRAINT CK_Users_Email CHECK (email LIKE '%_@_%._%'),
    password VARCHAR(250) NOT NULL,
    address VARCHAR(250) NOT NULL,
    latitude DECIMAL(9,6) NOT NULL,
    longitude DECIMAL(9,6) NOT NULL
);

CREATE TABLE Kitchens (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL CONSTRAINT UQ_Kitchens_Email UNIQUE,
    CONSTRAINT CK_Kitchens_Email CHECK (email LIKE '%_@_%._%'),
    password VARCHAR(250) NOT NULL,
    address VARCHAR(250) NOT NULL,
    latitude DECIMAL(9,6) NOT NULL,
    longitude DECIMAL(9,6) NOT NULL,
    rating DECIMAL(3,2) DEFAULT 0 NOT NULL,
    CONSTRAINT CK_Kitchens_Rating CHECK (rating BETWEEN 0 AND 5),
    status VARCHAR(15) DEFAULT 'Available' NOT NULL,
    CONSTRAINT CK_Kitchens_Status CHECK (status IN ('Available', 'Not Available')),
    profile_image_url VARCHAR(250) NULL,
    profile_image_id VARCHAR(50) NULL
);

CREATE TABLE Plans (
    id INT PRIMARY KEY IDENTITY(1,1),
    name VARCHAR(100) NOT NULL,
    kitchen_id INT NOT NULL,
    price INT NOT NULL, --per week price it is
	description varchar(max) null,
    CONSTRAINT FK_Plans_Kitchens FOREIGN KEY (kitchen_id) REFERENCES Kitchens(id) ON DELETE CASCADE
);

CREATE TABLE Meals (
    id INT PRIMARY KEY IDENTITY(1,1),
    plan_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    price INT NOT NULL,
    CONSTRAINT CK_Meals_Price CHECK (price > 0),
    CONSTRAINT FK_Meals_Plans FOREIGN KEY (plan_id) REFERENCES Plans(id) ON DELETE CASCADE
);

CREATE TABLE Meal_Days (
    id INT IDENTITY(1,1) not null unique,
    meal_id INT NOT NULL,
    day VARCHAR(10) NOT NULL,
    timing TIME(0) NOT NULL,
    CONSTRAINT CK_MealDays_Day CHECK (day IN ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')),
    CONSTRAINT FK_MealDays_Meals FOREIGN KEY (meal_id) REFERENCES Meals(id) ON DELETE CASCADE,
	constraint pk_mealDays primary key (meal_id, day, timing)
);

CREATE TABLE Payments (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    plan_id INT NOT NULL,
    paid_amount DECIMAL(10,2) NOT NULL,
    persons INT NOT NULL,
    date DATETIME DEFAULT GETDATE() NOT NULL,
    method VARCHAR(50) NOT NULL,
    CONSTRAINT CK_Payments_Method CHECK (method IN ('Easypaisa', 'JazzCash', 'Sadapay', 'Bank Transfer')),
    status VARCHAR(50) NOT NULL,
    CONSTRAINT CK_Payments_Status CHECK (status IN ('Pending', 'Success', 'Failed', 'over paid', 'under paid')),
    outstanding_amount DECIMAL(10,2) NULL,
    CONSTRAINT CK_Payments_Outstanding CHECK (outstanding_amount >= 0),
    screenshot_url VARCHAR(MAX) NULL,
    transaction_id VARCHAR(100) NOT NULL UNIQUE,
    sender_name VARCHAR(255) NOT NULL,
    sender_reference VARCHAR(100) NOT NULL,
    required_amount DECIMAL(10,2) NOT NULL,
    CONSTRAINT FK_Payments_Users FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    CONSTRAINT FK_Payments_Plans FOREIGN KEY (plan_id) REFERENCES Plans(id) ON DELETE CASCADE
);

CREATE TABLE Reviews (
    id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT NOT NULL,
    kitchen_id INT NOT NULL,
    rating INT NOT NULL,
    comment NVARCHAR(MAX) NULL,
    date DATETIME DEFAULT GETDATE() NOT NULL,
    CONSTRAINT FK_Reviews_Users FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    CONSTRAINT FK_Reviews_Kitchens FOREIGN KEY (kitchen_id) REFERENCES Kitchens(id) ON DELETE CASCADE
);

CREATE TABLE Subscriptions (
    id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT NOT NULL,
    plan_id INT NOT NULL,
    persons INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    start_date DATE DEFAULT CAST(GETDATE() AS DATE),
    type VARCHAR(10) NOT NULL,
    CONSTRAINT CK_Subscriptions_Type CHECK (type IN ('weekly', 'monthly')),
    end_date DATE NOT NULL,
    status VARCHAR(10) NOT NULL DEFAULT 'running',
    CONSTRAINT CK_Subscriptions_Status CHECK (status IN ('running', 'stopped', 'completed')),
    CONSTRAINT FK_Subscriptions_Users FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    CONSTRAINT FK_Subscriptions_Plans FOREIGN KEY (plan_id) REFERENCES Plans(id) ON DELETE CASCADE
);

CREATE TABLE Refunds (
    id INT PRIMARY KEY IDENTITY(1,1),
    payment_id INT NOT NULL,
    amount INT NOT NULL,
    reason VARCHAR(MAX) NULL,
    date DATETIME DEFAULT GETDATE() NOT NULL,
    method VARCHAR(50) NOT NULL,
    CONSTRAINT CK_Refunds_Method CHECK (method IN ('Easypaisa', 'JazzCash', 'Sadapay', 'Bank Transfer')),
    status VARCHAR(50) NOT NULL,
    CONSTRAINT CK_Refunds_Status CHECK (status IN ('Pending', 'Success', 'Failed')),
    transaction_id VARCHAR(100) NOT NULL UNIQUE,
    CONSTRAINT FK_Refunds_Payments FOREIGN KEY (payment_id) REFERENCES Payments(id) ON DELETE CASCADE
);


--stored Procedures

--all running subscription of a kitchen
create procedure GetRunningSubscriptions
@kitchen_id int
AS
BEGIN
select allsubscriptions.*, name user_name, email user_email, phone user_phone, address user_address from users
inner join 
(select * from subscriptions where plan_id 
in (select id from plans where kitchen_id=@kitchen_id) and status='running') allsubscriptions
on allsubscriptions.user_id = users.id;
END;

alter procedure getPlanSchedule
@plan_id int
AS
BEGIN
select m.name, m.price, md.day, md.timing
from plans p
inner join Meals m on m.plan_id=p.id
inner join Meal_Days md on md.meal_id=m.id
where p.id=@plan_id;
END;

exec getPlanSchedule 2

alter procedure getplanfromsubscription
@subscription_id int
AS
Begin
select p.id, p.name, p.price
from (select * from plans where id=(select plan_id from subscriptions where id=@subscription_id)) p
END;

exec getplanfromsubscription 1
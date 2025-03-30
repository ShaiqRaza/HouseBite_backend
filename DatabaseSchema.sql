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
    price Decimal(10, 2) NOT NULL, --per week price it is
	description varchar(max) null,
    CONSTRAINT FK_Plans_Kitchens FOREIGN KEY (kitchen_id) REFERENCES Kitchens(id) ON DELETE CASCADE,
	CONSTRAINT CK_Plans_price check (price > 0);
);

CREATE TABLE Meals (
    id INT PRIMARY KEY IDENTITY(1,1),
    plan_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    price Decimal(10, 2) NOT NULL,
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

--this is for subscription logs so that we can delete completed/failed subscriptions and for logs we can use this less redundant and less space consuming table
create table user_kitchen_relation (
	user_id int not null,
	kitchen_id int not null,
	constraint u_id_fk foreign key (user_id) references users(id),
	constraint k_id_fk foreign key (kitchen_id) references kitchens(id),
	constraint ukr_pk primary key (user_id, kitchen_id)
);

create table review_replies (
	id int identity(1,1) not null,
	review_id int not null,
	kitchen_id int not null,
	comment nvarchar(max) not null,
	constraint kid_fk_rr foreign key (kitchen_id) references kitchens(id),
	constraint rid_fk_rr foreign key (review_id) references reviews(id),
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

alter procedure getplanfromsubscription
@subscription_id int
AS
Begin
select p.id, p.name, p.price
from (select * from plans where id=(select plan_id from subscriptions where id=@subscription_id)) p
END;

--alter procedure getPlanSchedule
--@plan_id int
--AS
--BEGIN
--select m.name, m.price, md.day, md.timing
--from plans p
--inner join Meals m on m.plan_id=p.id
--inner join Meal_Days md on md.meal_id=m.id
--where p.id=@plan_id;
--END;

create procedure getPlanMeals
@plan_id int
AS
BEGIN
select m.name, m.id, m.price
from meals m
where m.plan_id=@plan_id;
END;

create procedure getMealDayTiming
@meal_id int
AS
Begin
select md.id, md.day, md.timing
from Meal_Days md
where md.meal_id=@meal_id;
END;

alter procedure SubscribePlan 
@plan_id int,
@user_id int,
@persons int,
@type varchar(10)
AS
BEGIN 
	Declare @end_date date
	Declare @price Decimal(10, 2)
	set @price = (select price from plans where id=@plan_id)
	 
	if @price is not null
	BEGIN
		if exists (select * from users where id=@user_id)
		BEGIN
			IF @type = 'weekly'
				BEGIN
					SET @end_date = DATEADD(DAY, 8, GETDATE());
					SET @price = @price * @persons;
				END
			ELSE
				BEGIN
					SET @end_date = DATEADD(DAY, 31, GETDATE());
					set @price = (@price * 4) + (@price * 0.285714);
					SET @price = @price * @persons;
				END
			insert into subscriptions (user_id, plan_id, persons, price, type, start_date, end_date) OUTPUT INSERTED.*
			values (@user_id, @plan_id, @persons, @price, @type, DATEADD(DAY, 1, GETDATE()), @end_date);
		END;
		else
			throw 50001, 'User ID is incorrect.', 1
	END;
	else
		throw 50002, 'Plan ID is incorrect.', 1
END;

alter procedure addReview
@user_id int,
@kitchen_id int,
@rating int,
@comment nvarchar(max)
as
begin
	if not exists (select 1 from users where id=@user_id)
		throw 50001, 'User ID is incorrect', 1;
	if not exists (select 1 from kitchens where id=@kitchen_id)
		throw 50001, 'Kitchen ID is incorrect', 1;
	if not exists (select 1 from user_kitchen_relation where user_id=@user_id and kitchen_id=@kitchen_id)
		throw 50001, 'This user is not allowed to add review to this kitchen', 1;
	if @rating>=0 and @rating<=5
	begin
		insert into reviews (user_id, kitchen_id, rating, comment) output inserted.*
		values
		(@user_id, @kitchen_id, @rating, @comment);
	end;
	else
		throw 50001, 'Rating must be from 0 to 5', 1;
end;

alter procedure editReview
@user_id int,
@review_id int,
@comment nvarchar(max)
as
begin
	if not exists (select 1 from users where id=@user_id)
		throw 50001, 'User ID is incorrect', 1;
	if not exists (select 1 from reviews where id=@review_id)
		throw 50001, 'Review ID is incorrect', 1;
	if not exists (select 1 from reviews where user_id=@user_id and id=@review_id)
		throw 50001, 'This user is not allowed to edit this review.', 1;
	if @comment is null
		throw 50001, 'Nothing to Update.', 1;
	else
		begin
			update reviews
			set comment=@comment
			output inserted.*
			where id=@review_id;
		end;
end;

create procedure GetRunningSubscriptionsOfUser
@user_id int
AS
BEGIN
	if exists (select 1 from users where id = @user_id)
		select * from subscriptions where user_id=@user_id and status='running';
	else
		throw 50001, 'User ID is incorrect', 1;
END;

create procedure changeStatus
@status varchar(15),
@kitchen_id int
as
begin
	if not exists (select 1 from Kitchens where id=@kitchen_id)
		throw 50001, 'Kitchen ID is incorrect', 1;
	if @status='available' or @status='not available'
		begin
			update kitchens
			set status=@status
			output inserted.*
			where id=@kitchen_id;
		end;
	else
		throw 50001, 'Given status is incorrect.', 1;
end;

alter procedure reply_to_review
@review_id int,
@kitchen_id int,
@comment nvarchar(max)
as
begin
	if not exists (select 1 from kitchens where id=@kitchen_id)
		throw 50001, 'Kitchen ID is incorrect', 1;
	if not exists (select 1 from reviews where id=@review_id and kitchen_id=@kitchen_id)
		throw 50001, 'Review ID or Kitchen ID is incorrect', 1;
	if @comment is null
		throw 50001, 'Nothing to comment', 1;
	else
		begin
			insert into review_replies (review_id, comment)
			output inserted.*
			values
			(@review_id, @comment);
		end;
end;

alter procedure getReviewsOfKitchen
@kitchen_id int
as
begin
	if not exists (select 1 from reviews where kitchen_id=@kitchen_id)
		throw 50001, 'Kitchen ID is incorrect', 1;
	select name, comment, rating, r.id as review_id from users u
	inner join 
	(select user_id, comment, rating, id from Reviews where kitchen_id=@kitchen_id) r
	on r.user_id=u.id;
end;
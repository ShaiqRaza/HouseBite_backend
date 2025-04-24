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
    start_date DATE DEFAULT CAST(GETDATE() AS DATE),
    type VARCHAR(10) NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(10) NOT NULL DEFAULT 'running',
    CONSTRAINT CK_Subscriptions_Type CHECK (type IN ('weekly', 'monthly')),
    CONSTRAINT CK_Subscriptions_Status CHECK (status IN ('running', 'stopped', 'completed')),
    CONSTRAINT FK_Subscriptions_Users FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    CONSTRAINT FK_Subscriptions_Plans FOREIGN KEY (plan_id) REFERENCES Plans(id) ON DELETE CASCADE
);

CREATE TABLE Subscription_Pricing (
    plan_id INT NOT NULL,
    persons INT NOT NULL,
    type VARCHAR(10) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    
    CONSTRAINT PK_SubscriptionPricing PRIMARY KEY (plan_id, persons, type),
    CONSTRAINT CK_SubscriptionPricing_Type CHECK (type IN ('weekly', 'monthly')),
    CONSTRAINT CK_SubscriptionPricing_Price CHECK (price >= 0),
    CONSTRAINT CK_SubscriptionPricing_Persons CHECK (persons > 0),
    CONSTRAINT FK_SubscriptionPricing_Plans FOREIGN KEY (plan_id) REFERENCES Plans(id) ON DELETE CASCADE
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

create table kitchen_reports(
	id int primary key identity(1,1),
	user_id int not null,
	kitchen_id int not null,
	reason varchar(max),
	reported_at DATETIME DEFAULT GETDATE(),
	CONSTRAINT ukr_unique_report UNIQUE (user_id, kitchen_id),
	constraint kid_fk_reports foreign key (kitchen_id) references kitchens(id),
	constraint uid_fk_reports foreign key (user_id) references users(id),
);

--stored Procedures

--all running subscription of a kitchen
alter procedure GetRunningSubscriptions
@kitchen_id int
AS
BEGIN
select allsubscriptions.*, name user_name, email user_email, phone user_phone, address user_address from users
inner join 
(
select s.*, sp.price 
from subscriptions s 
inner join Subscription_Pricing sp 
ON sp.plan_id = s.plan_id AND s.persons = sp.persons AND s.type = sp.type
where s.plan_id in (select id from plans where kitchen_id=@kitchen_id) 
and status='running'
)allsubscriptions
on allsubscriptions.user_id = users.id;
END;

create procedure getplanfromsubscription
@subscription_id int
AS
Begin
select p.id, p.name, p.price
from (select * from plans where id=(select plan_id from subscriptions where id=@subscription_id)) p
END;

alter PROCEDURE get_kitchen_schedule_today
    @kitchen_id INT
AS
BEGIN
    SET NOCOUNT ON;

	if not exists (select 1 from kitchens where id=@kitchen_id)
		throw 50001, 'Kitchen ID is incorrect', 1;

    DECLARE @today_day VARCHAR(10);
    SET @today_day = DATENAME(WEEKDAY, GETDATE());

    SELECT
        md.timing,
        (
            SELECT
                m.name AS meal,
                u.name AS user_name,
                u.address AS user_address,
				s.persons
            FROM Subscriptions s
            INNER JOIN Users u ON u.id = s.user_id
            INNER JOIN Plans p ON p.id = s.plan_id
            INNER JOIN Meals m ON m.plan_id = p.id
            INNER JOIN Meal_Days md2 ON md2.meal_id = m.id
            WHERE 
                p.kitchen_id = @kitchen_id
                AND md2.timing = md.timing
                AND md2.day = @today_day
                AND s.status = 'running'
            FOR JSON PATH
        ) AS time_schedule
    FROM Meals m
    INNER JOIN Plans p ON p.id = m.plan_id
    INNER JOIN Meal_Days md ON md.meal_id = m.id AND md.day = @today_day
    WHERE p.kitchen_id = @kitchen_id
    GROUP BY md.timing
    ORDER BY md.timing;
END;

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
	Declare @sub_id int
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
			insert into subscriptions (user_id, plan_id, persons, type, start_date, end_date)
			values (@user_id, @plan_id, @persons, @type, DATEADD(DAY, 1, GETDATE()), @end_date);
			SET @sub_id = SCOPE_IDENTITY();
			 IF NOT EXISTS (
                SELECT 1 FROM Subscription_Pricing 
                WHERE plan_id = @plan_id AND persons = @persons AND type = @type
            )
			begin
				insert into Subscription_Pricing (plan_id, persons, price, type)
				values (@plan_id, @persons, @price, @type);
			end;

			SELECT 
                s.id,
                s.user_id,
                s.plan_id,
                s.persons,
                s.type,
                sp.price,
                s.start_date,
                s.end_date
            FROM Subscriptions s
            JOIN Subscription_Pricing sp
                ON s.plan_id = sp.plan_id AND s.persons = sp.persons AND s.type = sp.type
            WHERE s.id = @sub_id;

		END;
		else
			throw 50001, 'User ID is incorrect.', 1
	END;
	else
		throw 50002, 'Plan ID is incorrect.', 1
END;

create procedure addReview
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

create procedure editReview
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

alter procedure GetRunningSubscriptionsOfUser
@user_id int
AS
BEGIN
	if exists (select 1 from users where id = @user_id)
		select 
         s.id,
         s.user_id,
         s.plan_id,
         s.persons,
         s.type,
         sp.price,
         s.start_date,
         s.end_date
		from subscriptions s join Subscription_Pricing sp on s.plan_id = sp.plan_id AND s.persons = sp.persons AND s.type = sp.type
		where user_id=@user_id and status='running';
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

create procedure reply_to_review
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

create procedure getReviewsOfKitchen
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

create procedure updateRatingOfKitchen
@kitchen_id int
as
begin
	Declare @ratingAns decimal(3, 2)
	set  @ratingAns=0
	Declare @sum decimal(6,2)
	Declare @reviewCount int

	set @reviewCount = (select count(*) from reviews where kitchen_id=@kitchen_id);

	if @reviewCount>0
		begin
			set @sum = (select cast(Sum(rating) as decimal(6, 2)) from reviews where kitchen_id=@kitchen_id);
			set @ratingAns = cast( @sum/@reviewCount as decimal(3,2) );
			update kitchens
			set rating=@ratingAns
			where id=@kitchen_id
		end;
	else
		throw 50001, 'No Reviews yet', 1;
end;

Create PROCEDURE UpdateSubscriptionStatus
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE Subscriptions
    SET status = 'completed'
    WHERE 
        status = 'running'
        AND end_date <= CAST(GETDATE() + 1 AS DATE);
END

create procedure report_kitchen
@user_id int,
@kitchen_id int,
@reason varchar(max)
AS
begin
	if not exists (select 1 from users where id=@user_id)
		throw 50001, 'User ID is incorrect', 1;
	if not exists (select 1 from kitchens where id=@kitchen_id)
		throw 50001, 'Kitchen ID is incorrect', 1;
	if not exists (select 1 from user_kitchen_relation where user_id=@user_id and kitchen_id=@kitchen_id)
		throw 50001, 'This user is not allowed to add review to this kitchen', 1;
	INSERT INTO kitchen_reports (user_id, kitchen_id, reason, reported_at)
	output inserted.*
    VALUES (@user_id, @kitchen_id, @reason, GETDATE());
end;
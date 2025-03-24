import sql from '../configurations/db.config.js';
import { requireKitchenLogin } from '../middlewares/requireKitchenLogin.js';

//this will return all plans of a kitchen along with their schedules
export const getAllPlans = async (req, res) => {
    const id = req.params.id || null;
    if (!id) 
        return res.status(400).json({ message: "Kitchen ID is required." });
    try{
        const plans = await sql.query(`SELECT * FROM plans where kitchen_id=${id}`);
        if(plans.recordset.length === 0)
            return res.status(404).json({ message: "Plan ID is incorrect." });
        const DetailedPlans = await Promise.all 
        (
            plans.recordset.map(async (plan) => {
            const schedule = await sql.query`exec getPlanSchedule ${plan.id}`;
            plan.schedule = schedule.recordset;
            return plan;
            })
        );
        res.status(200).json(DetailedPlans);
    }
    catch(err){
        res.status(500).json({ 
            message: "An error occurred while fetching plans.",
            error: err.message 
        });
    }
};

export const createplan = async (req, res) => {
    const id = req.params.id;
    if (!id) 
        return res.status(400).json({ message: "Kitchen ID is required." });
    
    const { plan_name, plan_description, meals } = req.body;

    if(!plan_name || meals.length === 0)
        return res.status(400).json({ message: "All fields are required." });

    let newPlan = null;

    //calculating the price of the plan
    let plan_price = 0;
    meals.forEach(meal => {
        plan_price = plan_price + (meal.price * (meal.meal_days?.length || 1));
    });

    try{
        newPlan = await sql.query`INSERT INTO plans (name, description, price, kitchen_id) output inserted.id VALUES (${plan_name}, ${plan_description || null}, ${plan_price}, ${id})`;
        const plan_id = newPlan.recordset[0].id;
        await Promise.all(
            meals.map(async meal => {
                const new_meal = await sql.query`INSERT INTO meals (plan_id, name, price) output inserted.id VALUES (${plan_id}, ${meal.name}, ${meal.price})`;
                const meal_id = new_meal.recordset[0].id;

                await Promise.all(
                    meal.meal_days?.map(async meal_day => {
                        await sql.query`INSERT INTO meal_days (meal_id, day, timing) VALUES (${meal_id}, ${meal_day.day}, ${meal_day.timing})`;
                    })
                );
            })
        );
        res.status(201).json({ message: "Plan created successfully." });
    }
    catch(err){
        if(newPlan) 
            await sql.query`DELETE FROM plans WHERE id=${newPlan.recordset[0].id}`;
        res.status(500).json({ 
            message: "An error occurred while creating the plan.",
            error: err.message 
        });
    }
}

export const deletePlan = async (req, res) => {
    const id = req.params.id;
    if (!id) 
        return res.status(400).json({ message: "Plan ID is required." });

    try{
        const deletedPlan = await sql.query`DELETE FROM plans output deleted.* WHERE id=${id}`;//if I delete plans, respective meals and meal_days will be automatically deleted
        if(deletedPlan.recordset.length === 0)
            return res.status(400).json({message: "Plan ID is incorrect."});
        res.status(200).json({ message: "Plan deleted successfully." });
    }
    catch(err){
        res.status(500).json({ 
            message: "An error occurred while deleting the plan.",
            error: err.message 
        });
    }
};

export const updatePlan = async (req, res) => {
    const {name, description} = req.body || {};
    const id = req.params.id;
    if(!id)
        return res.status(400).json({ message: "Plan ID is required." });

    if(!name && !description)
        return res.status(400).json({ message: "Nothing to update." });

    let updates = [];
    if(name) updates.push(`name = '${name}'`);
    if(description) updates.push(`description = '${description}'`);

    try{
        const plan = await sql.query(`UPDATE plans SET ${updates.join(", ")} output inserted.* WHERE id=${id}`);
        if(plan.recordset.length === 0)
            return res.status(400).json({message: "Plan ID is incorrect."});
        res.status(200).json(plan.recordset[0]);
    }
    catch(err){
        res.status(500).json({ 
            message: "An error occurred while updating the plan.",
            error: err.message 
        });
    }
};

export const deleteMeal = async (req, res) => {
    const id = req.params.id;
    if (!id) 
        return res.status(400).json({ message: "Meal ID is required." });

    try{
        const deletedMeal = await sql.query`DELETE FROM meals output deleted.* WHERE id=${id}`;
        if(deletedMeal.recordset.length === 0)
            return res.status(400).json({message: "Meal ID is incorrect."});
        res.status(200).json({ message: "Meal deleted successfully." });
    }
    catch(err){
        res.status(500).json({ 
            message: "An error occurred while deleting the meal.",
            error: err.message
        });
    }
};

export const updateMeal = async (req, res) => {
    const {name, price} = req.body || {};
    const id = req.params.id;

    if(!id)//meal id is required
        return res.status(400).json({ message: "Meal ID is required." });

    if(!(name || price)) 
        return res.status(400).json({ message: "Nothing to update." });

    let updates = [];
    if(name) updates.push(`name = '${name}'`);
    if(price) updates.push(`price = ${price}`);

    try{
        const meal = await sql.query(`UPDATE meals SET ${updates.join(", ")} output inserted.* WHERE id=${id}`);
        if(!meal.recordset[0])
            res.status(400).json({message: "Meal ID is incorrect."});
        res.status(200).json(meal.recordset[0]);
    }
    catch(err){
        res.status(500).json({ 
            message: "An error occurred while updating the meal.",
            error: err.message 
        });
    }
};

export const addMeal = async (req, res) => {
    const id = req.params.id;
    if(!id)
        return res.status(400).json({ message: "Plan ID is required." });

    const {name, price, meal_days} = req.body || {};
    if(!name || !price || meal_days.length===0)
        return res.status(400).json({ message: "All fields are required." });

    let meal = null;
    
    try{
        const plan = await sql.query`SELECT * FROM plans WHERE id=${id}`;
        if(plan.recordset.length===0)
            return res.status(404).json({ message: "Plan ID is incorrect." });

        meal = await sql.query`INSERT INTO meals (name, price, plan_id) output inserted.* VALUES (${name}, ${price}, ${id})`;
        const meal_id = meal.recordset[0].id;
        const mel_uploaded = await Promise.all(
            meal_days.map(async (meal_day)=>{
                return await sql.query`INSERT INTO meal_days (meal_id, day, timing) VALUES (${meal_id}, ${meal_day.day}, ${meal_day.timing})`;
            })
        )
        res.status(201).json({message: "Meal added successfully."});
    }
    catch(err){
        if(meal)
            await sql.query(`DELETE FROM meals WHERE id=${meal.recordset[0].id}`);
        res.status(500).json({ 
            message: "An error occurred while adding the meal.",
            error: err.message 
        });
    }
};

export const updateMealDay = async (req, res) => {
    const {day, timing} = req.body || {};
    const id = req.params.id;
    if(!id)
        return res.status(400).json({ message: "Meal Day ID is required." });

    if(!(day || timing))
        return res.status(400).json({ message: "Nothing to update." });

    let updates = [];
    if(day) updates.push(`day = '${day}'`);
    if(timing) updates.push(`timing = '${timing}'`);

    try{
        const meal_day = await sql.query(`UPDATE meal_days SET ${updates.join(", ")} output inserted.* WHERE id=${id}`);
        if(!meal_day.recordset[0])
            return res.status(400).json({message: "Meal Day ID is incorrect."});
        res.status(200).json(meal_day.recordset[0]);
    }
    catch(err){
        res.status(500).json({ 
            message: "An error occurred while updating the meal day.",
            error: err.message 
        });
    }
};

export const addMealDay = async (req, res) => {
    const id = req.params.id;
    if(!id)
        return res.status(400).json({ message: "Meal ID is required." });

    const {day, timing} = req.body || {};
    if(!(day && timing))
        return res.status(400).json({ message: "All fields are required." });

    try{
        const meal = await sql.query`SELECT * FROM meals WHERE id=${id}`;
        if(meal.recordset.length===0)
            return res.status(404).json({ message: "Meal ID is incorrect." });

        const meal_day = await sql.query`INSERT INTO meal_days (meal_id, day, timing) output inserted.* VALUES (${id}, ${day}, ${timing})`;
        res.status(201).json(meal_day.recordset[0]);
    }
    catch(err){
        res.status(500).json({ 
            message: "An error occurred while adding the meal day.",
            error: err.message 
        });
    }
};
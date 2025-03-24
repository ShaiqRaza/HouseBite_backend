import sql from '../configurations/db.config.js';
import { requireKitchenLogin } from '../middlewares/requireKitchenLogin.js';

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
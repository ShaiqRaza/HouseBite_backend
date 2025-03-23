import sql from '../configurations/db.config.js';
import { requireKitchenLogin } from '../middlewares/requireKitchenLogin.js';

export const deletePlan = async (req, res) => {
    const id = req.params.id;
    if (!id) 
        return res.status(400).json({ message: "Plan ID is required." });

    try{
        await sql.query`DELETE FROM plans WHERE id=${id}`;//if I delete plans, respective meals and meal_days will be automatically deleted
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
        res.status(200).json(plan.recordset[0]);
    }
    catch(err){
        res.status(500).json({ 
            message: "An error occurred while updating the plan.",
            error: err.message 
        });
    }
};
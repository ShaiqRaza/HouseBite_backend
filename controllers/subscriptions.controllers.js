import sql from '../configurations/db.config.js';

export const getAllSubscriptions = async (req, res) => {
    try {
        const subscriptions = await sql.query('SELECT * FROM subscriptions');
        res.status(200).json(subscriptions.recordset);
    } catch (error) {
        res.status(500).json({
            message: "An error occurred while fetching subscriptions.",
            error: error.message
        });
    }
};

//for a kitchen
export const getRunningSubscriptions = async (req, res) => {
    const id = req.params.id || null;
    if (!id) {
        return res.status(400).json({ message: "Kitchen ID is required for updating." });
    }

    try{
        const kitchen = await sql.query`SELECT * FROM kitchens WHERE id=${id}`;

        if(kitchen.recordset.length == 0){
            return res.status(404).json({ message: "Kitchen not found!" });
        }

        const subscriptions = await sql.query`exec GetRunningSubscriptions ${id}`;
        res.status(200).json(subscriptions.recordset);
    }
    catch(err){
        res.status(500).json({ 
            message: "An error occurred while fetching the subscriptions of your kitchen.",
            error: err.message 
        });
    }
};

export const getPlanDetailsForSubscription = async (req, res) => {
    const id = req.params.id;
    if(!id){
        return res.status(400).json({ message: "Subscription ID is required." });
    }

    try {
        const plan = await sql.query`exec getplanfromsubscription ${id}`
        if(plan.recordset.length == 0)
            return res.status(404).json({ message: "Plan ID is incorrect." });

        const meals = await sql.query`exec getPlanMeals ${plan.recordset[0].id}`

        await Promise.all(meals.recordset.map(async meal => {
            const schedule = await sql.query`exec getMealDayTiming ${meals.recordset[0].id}`
            meal.schedule = schedule.recordset;
        })
        );

        res.status(200).json({
            plan: plan.recordset[0],
            meals: meals.recordset
        });
    } catch (error) {
        res.status(500).json({
            message: "An error occurred while fetching plans.",
            error: error.message
        });
    }
};
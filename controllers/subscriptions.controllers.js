import sql from 'sql';

export const getPlanForSubscription = async (req, res) => {
    const id = req.params.id;
    if(!id){
        return res.status(400).json({ message: "Subscription ID is required." });
    }

    try {
        const plan = await sql.query`exec getplanfromsubscription ${id}`
        const schedule = await sql.query`exec getPlanSchedule ${plan.recordset[0].id}`

        res.status(200).json({
            plan: plan.recordset[0],
            schedule: schedule.recordset
        });
    } catch (error) {
        res.status(500).json({
            message: "An error occurred while fetching plans.",
            error: error.message
        });
    }
};
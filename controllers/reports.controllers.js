import sql from "../configurations/db.config.js";

export const reportKitchen = async (req, res) => {
    const {user_id, kitchen_id} = req.params;

    const {reason} = req.body || {};

    if(!reason)
        return res.status(400).json({message: "Reason is not given."});

    try{
        const report = await sql.query`exec report_kitchen ${user_id}, ${kitchen_id}, ${reason}`;
        res.json(report.recordset[0]);
    }
    catch(err){
        res.status(500).json({ 
            message: "An error occurred while reporting the kitchen.",
            error: err.message 
        });
    }
};
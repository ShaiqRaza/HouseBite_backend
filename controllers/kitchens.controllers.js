import sql from '../configurations/db.js';

export const getAllkitchens = async (req, res) => {
    try{
        const kitchens = await sql.query`SELECT * FROM kitchens`;
        res.status(200).json(kitchens);
    }
    catch(err){
        res.status(500).json({ 
            message: "An error occurred while fetching kitchens.",
            error: err.message 
        });
    }
}
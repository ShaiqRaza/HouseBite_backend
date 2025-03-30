import sql from "../configurations/db.config.js";

export const addReview = async (req, res) => {
    const {user_id, kitchen_id} = req.params || {};
    if(!user_id)
        return res.status(400).json({message: "User ID is not given."});
    if(!kitchen_id)
        return res.status(400).json({message: "Kitchen ID is not given."});

    const {rating, comment} = req.body;
    if(!(rating))
        return res.status(400).json({ message: "Rating is compulsory." });

    try{
        const reviewData = await sql.query`exec addReview ${user_id}, ${kitchen_id}, ${rating}, ${comment}`;
        res.status(200).json(reviewData.recordset[0]);
    }
    catch(err){
        res.status(500).json({ 
            message: "An error occurred while adding the review.",
            error: err.message 
        });
    }
}
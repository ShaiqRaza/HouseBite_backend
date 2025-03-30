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

export const editReview = async (req, res) => {
    const {user_id, review_id} = req.params || {}; 
    if(!user_id)
        return res.status(400).json({message: "User ID is not given."});
    if(!review_id)
        return res.status(400).json({message: "Review ID is not given."});

    const comment = req.body.comment || null;
    try{
        const reviewData = await sql.query`exec editReview ${user_id}, ${review_id}, ${comment}`;
        res.status(200).json(reviewData.recordset[0]);
    }
    catch(err){
        res.status(500).json({ 
            message: "An error occurred while editing the review.",
            error: err.message 
        });
    }
}

export const deleteReview = async (req, res) => {
    const id = req.params;
    if(!id)
        return res.status(400).json({message: 'Review ID is not given.'});
    try{
        const deletedReview = sql.query`delete from reviews output deleted.* where id=${id}`
        if(deletedReview.recordset[0].length == 0)
            return res.status(400).json({message: 'Review ID is incorrect.'})
        res.status(200).json({message: 'Review Deleted successfully'});
    }
    catch(err){
        res.status(500).json({ 
            message: "An error occurred while deleting the review.",
            error: err.message 
        });
    }
}
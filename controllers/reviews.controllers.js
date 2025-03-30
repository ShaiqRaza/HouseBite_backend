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
    const id = req.params.id;
    if(!id)
        return res.status(400).json({message: 'Review ID is not given.'});
    try{
        const deletedReview = await sql.query`delete from reviews output deleted.* where id=${id}`

        if(deletedReview.recordset.length == 0)
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

export const replyToReview = async (req, res) => {
    const {review_id, kitchen_id} = req.params;
    const {comment} = req.body || {};

    try{
        const reply = await sql.query`exec reply_to_review ${review_id}, ${kitchen_id}, ${comment}`;
        res.json(reply.recordset[0]);
    }
    catch(err){
        res.status(500).json({ 
            message: "An error occurred while replying the review.",
            error: err.message 
        });
    }
}

export const editReply = async (req, res) => {
    const id = req.params.id;
    const {comment} = req.body || {};
    if(!comment)
        return res.status(400).json({message: 'All fields are required.'});

    try{
        const editedReply = await sql.query`update review_replies set comment=${comment} output inserted.* where id=${id}`
        if(!editedReply)
            return res.status(400).json({message: 'Review ID is incorrect!'})
        res.status(200).json(editedReply.recordset[0]);
    }
    catch(err){
        res.status(500).json({ 
            message: "An error occurred while editing the reply.",
            error: err.message 
        });
    }
}

export const getReviewsOfKitchen = async (req, res) => {
    const {kitchen_id} = req.params;
    
    try{
        let reviews = await sql.query`exec getReviewsOfKitchen ${kitchen_id}`;
        if(reviews.recordset.length == 0)
            return res.status(404).json({message: 'No reviews found for this kitchen.'});

        reviews = await Promise.all (
            reviews.recordset.map(async review => {
                const replies = await sql.query`select comment from review_replies where review_id=${review.review_id}`;
                review.replies = replies.recordset;
                return review;
            })
        );

        res.status(200).json(reviews);
    }
    catch(err){
        res.status(500).json({ 
            message: "An error occurred while fetching the reviews.",
            error: err.message 
        });
    }
}
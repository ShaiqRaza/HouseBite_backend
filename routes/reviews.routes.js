import {addReview, editReview, deleteReview, replyToReview, editReply, getReviewsOfKitchen} from '../controllers/reviews.controllers.js';
import express from 'express';

const router = express.Router();

router.post('/add/:user_id/:kitchen_id', addReview);
router.post('/edit/:user_id/:review_id', editReview);
router.delete('/delete/:id', deleteReview);
router.post('/reply/:kitchen_id/:review_id', replyToReview);
router.post('/edit-reply/:id', editReply);//review_id as id
router.get('/kitchen/:kitchen_id', getReviewsOfKitchen); //kitchen id as id

export default router;
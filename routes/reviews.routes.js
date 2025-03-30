import {addReview, editReview, deleteReview} from '../controllers/reviews.controllers.js';
import express from 'express';

const router = express.Router();

router.post('/add/:user_id/:kitchen_id', addReview);
router.post('/edit/:user_id/:review_id', editReview);
router.delete('/delete/:id', deleteReview);

export default router;
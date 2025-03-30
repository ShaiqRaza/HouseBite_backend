import {addReview, editReview} from '../controllers/reviews.controllers.js';
import express from 'express';

const router = express.Router();

router.post('/add/:user_id/:kitchen_id', addReview);
router.post('/edit/:user_id/:review_id', editReview);

export default router;
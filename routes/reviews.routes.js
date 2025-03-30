import {addReview} from '../controllers/reviews.controllers.js';
import express from 'express';

const router = express.Router();

router.post('/add/:user_id/:kitchen_id', addReview);

export default router;
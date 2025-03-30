import { getAllUsers, createUser, subscribePlan, addReview } from "../controllers/users.controllers.js";
import express from 'express';

const router = express.Router();

router.get('/', getAllUsers);
router.post('/create', createUser);
router.post('/subscribe/:user_id/:plan_id', subscribePlan);
router.post('/review/:user_id/:kitchen_id', addReview);

export default router;
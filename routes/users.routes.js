import { getAllUsers, createUser, subscribePlan } from "../controllers/users.controllers.js";
import express from 'express';

const router = express.Router();

router.get('/', getAllUsers);
router.post('/create', createUser);
router.post('/subscribe/:user_id/:plan_id', subscribePlan);

export default router;
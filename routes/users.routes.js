import { getAllUsers, createUser, subscribePlan, updateUser, loginUser, isLoggedIn, logoutUser } from "../controllers/users.controllers.js";
import express from 'express';

const router = express.Router();

router.get('/', getAllUsers);
router.post('/create', createUser);
router.post('/update/:id', updateUser);
router.post('/subscribe/:user_id/:plan_id', subscribePlan);
router.post('/login', loginUser);
router.get('/status', isLoggedIn);
router.post('/logout', logoutUser)

export default router;
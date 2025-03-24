import { getAllUsers, createUser } from "../controllers/users.controllers.js";
import express from 'express';

const router = express.Router();

router.get('/', getAllUsers);
router.post('/create', createUser);

export default router;
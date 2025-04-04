import express from 'express';
import { reportKitchen } from '../controllers/reports.controllers.js';

const router = express.Router();

router.post('/kitchen/:user_id/:kitchen_id', reportKitchen);

export default router;
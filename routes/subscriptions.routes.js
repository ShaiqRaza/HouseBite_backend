import express from 'express';
import { getPlanForSubscription } from '../controllers/subscriptions.controllers.js';

const router = express.Router();

router.get('/plan/:id', getPlanForSubscription);

export default router;
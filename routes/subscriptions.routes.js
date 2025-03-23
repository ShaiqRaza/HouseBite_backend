import express from 'express';
import { getPlanForSubscription, getAllSubscriptions } from '../controllers/subscriptions.controllers.js';

const router = express.Router();

router.get('/plan/:id', getPlanForSubscription);
router.get('/', getAllSubscriptions);

export default router;
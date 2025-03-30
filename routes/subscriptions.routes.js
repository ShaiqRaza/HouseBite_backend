import express from 'express';
import { getPlanDetailsForSubscription, getAllSubscriptions, getRunningSubscriptions, getRunningSubscriptionsOfUser } from '../controllers/subscriptions.controllers.js';

const router = express.Router();

router.get('/plan/:id', getPlanDetailsForSubscription);//subscription id as id
router.get('/', getAllSubscriptions);
router.get('/kitchen/:id', getRunningSubscriptions);//kitchen id as id
router.get('/user/:id', getRunningSubscriptionsOfUser);//user id as id

export default router;
import express from 'express';
import { getAllkitchens, createKitchen, deleteKitchen, updateKitchenDetails, updateKitchenImage, getRunningSubscriptions, getAllPlans, createplan} from '../controllers/kitchens.controllers.js';
import upload from '../configurations/multer.config.js';
import {requireKitchenLogin} from '../middlewares/requireKitchenLogin.js';

const router = express.Router();

router.get('/', getAllkitchens);
router.post('/create', upload.single('image'), createKitchen);
router.delete('/:id', deleteKitchen);
router.post('/update/details/:id', updateKitchenDetails);   
router.post('/update/image/:id', upload.single('image'), updateKitchenImage);
router.get('/subscriptions/running/:id', getRunningSubscriptions);
router.get('/plans/:id', getAllPlans);
router.post('/plans/create/:id', createplan);

export default router;
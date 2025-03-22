import express from 'express';
import { getAllkitchens, createKitchen, deleteKitchen, updateKitchenDetails, updateKitchenImage, getRunningSubscriptions } from '../controllers/kitchens.controllers.js';
import upload from '../configurations/multer.config.js';

const router = express.Router();

router.get('/', getAllkitchens);
router.post('/create', upload.single('image'), createKitchen);
router.delete('/:id', deleteKitchen);
router.post('/update/details/:id', updateKitchenDetails);   
router.post('/update/image/:id', upload.single('image'), updateKitchenImage);
router.get('/subscriptions/running/:id', getRunningSubscriptions)

export default router;
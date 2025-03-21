import express from 'express';
import { getAllkitchens, createKitchen, deleteKitchen } from '../controllers/kitchens.controllers.js';
import upload from '../configurations/multer.config.js';

const router = express.Router();

router.get('/', getAllkitchens);
router.post('/create', upload.single('image'), createKitchen);
router.delete('/:id', deleteKitchen);

export default router;
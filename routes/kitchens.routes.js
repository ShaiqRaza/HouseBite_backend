import express from 'express';
import { getAllkitchens } from '../controllers/kitchens.controller.js';

const router = express.Router();

router.get('/', getAllkitchens);

export default router;
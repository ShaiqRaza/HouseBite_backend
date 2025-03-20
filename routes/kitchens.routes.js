import express from 'express';
import { getAllkitchens } from '../controllers/kitchens.controllers.js';

const router = express.Router();

router.get('/', getAllkitchens);

export default router;
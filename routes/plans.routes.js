import { deletePlan, updatePlan, deleteMeal } from "../controllers/plans.controllers.js";
import express from 'express';

const router = express.Router();

router.delete('/delete/:id', deletePlan);
router.post('/update/:id', updatePlan);
router.delete('/delete/meal/:id', deleteMeal);//meal id as id

export default router;
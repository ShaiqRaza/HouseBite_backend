import { deletePlan, updatePlan, deleteMeal, updateMeal, addMeal, getAllPlans, createplan, updateMealDay, addMealDay, deleteMealDay} from "../controllers/plans.controllers.js";
import express from 'express';

const router = express.Router();

router.delete('/delete/:id', deletePlan);
router.post('/update/:id', updatePlan);
router.delete('/delete/meal/:id', deleteMeal);//meal id as id
router.post('/update/meal/:id', updateMeal);//meal id as id
router.post('/add/meal/:id', addMeal);//plan id as id
router.post('/create/:id', createplan);//kitchen id as id
router.get('/kitchen/:id', getAllPlans);//kitchen id as id
router.post('/update/meal-day/:id', updateMealDay);//meal day id as id
router.post('/add/meal-day/:id', addMealDay);//meal id as id
router.delete('/delete/meal-day/:id', deleteMealDay);//meal day id as id

export default router;
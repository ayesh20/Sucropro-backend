import express from 'express';
import {
    addCalculations,
    getCalculations,
    clearCalculations
} from '../controllers/calculationController.js';

const calcRouter = express.Router();

calcRouter.post("/add",        addCalculations);
calcRouter.get("/get",         getCalculations);
calcRouter.delete("/clear",    clearCalculations);

export default calcRouter;
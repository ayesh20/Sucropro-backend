import express from "express";
import { calculatePurity, calculateRandement, getRendement } from "../controllers/rendementController.js";

const renRouter = express.Router();

renRouter.post("/calculate-purity", calculatePurity);
renRouter.post("/calculate-randement", calculateRandement);
renRouter.get("/get-rendement", getRendement);

export default renRouter;

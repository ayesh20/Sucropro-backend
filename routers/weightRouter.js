import express from "express";

import { createWeight, getAllWeights, getWeightById, updateWeight, updateWeightDelivery } from "../controllers/weightController.js";

const weightRouter = express.Router();

weightRouter.post("/create", createWeight);
weightRouter.get("/get-all", getAllWeights);
weightRouter.get("/find/:batchId", getWeightById);
weightRouter.put("/update", updateWeight);
weightRouter.patch("/update-delivery/:batchId", updateWeightDelivery);

export default weightRouter;
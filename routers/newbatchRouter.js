import express from 'express';
import {
    createBatch,
    getAllBatches,
    getBatchById,
    getBatchByBatchId,
    getBatchByFarmerId,
    updateBatchWeight,
    deleteBatch
} from '../controllers/newbatchController.js';

const batchRouter = express.Router();

batchRouter.post("/add", createBatch);

batchRouter.get("/get", getAllBatches);

batchRouter.get("/find/:batchId", getBatchByBatchId);
batchRouter.get("/find-by-farmer/:farmerId", getBatchByFarmerId);
batchRouter.patch("/update-delivery/:batchId", updateBatchWeight);

batchRouter.patch("/update-weight/:batchId", updateBatchWeight);

batchRouter.get("/:id", getBatchById);

batchRouter.delete("/:id", deleteBatch);

export default batchRouter;
import express from 'express';
import {
    createBatch,
    getAllBatches,
    getBatchById,
    deleteBatch
} from '../controllers/newbatchController.js';

const batchRouter = express.Router();

batchRouter.post("/add", createBatch);

batchRouter.get("/get", getAllBatches);

batchRouter.get("/:id", getBatchById);

batchRouter.delete("/:id", deleteBatch);

export default batchRouter;
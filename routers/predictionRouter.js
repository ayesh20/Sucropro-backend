import express from 'express';
import {
    getBatchDataForPrediction,
    runPrediction,
    getPredictionHistory,
    getLossSummary,
    getPredictionById,
    exportTrainingData,
    addTrainingRecord,
    bulkAddTrainingData
} from '../controllers/predictionController.js';

const predictionRouter = express.Router();

/* ── Prediction routes ── */
predictionRouter.get('/batch-data/:batchId', getBatchDataForPrediction);
predictionRouter.post('/run', runPrediction);
predictionRouter.get('/history', getPredictionHistory);
predictionRouter.get('/summary', getLossSummary);
predictionRouter.get('/:id', getPredictionById);

/* ── Training data routes ── */
predictionRouter.get('/training-data/export', exportTrainingData);
predictionRouter.post('/training-data/add', addTrainingRecord);
predictionRouter.post('/training-data/bulk-add', bulkAddTrainingData);

export default predictionRouter;

import express from 'express';
import {
    getDailyBatches,
    getStoragePerformance,
    getKpiSummary,
    getRendementTrend
} from '../controllers/chartsController.js';

const chartsRouter = express.Router();

chartsRouter.get('/daily-batches', getDailyBatches);
chartsRouter.get('/storage-performance', getStoragePerformance);
chartsRouter.get('/kpi-summary', getKpiSummary);
chartsRouter.get('/rendement-trend', getRendementTrend);

export default chartsRouter;

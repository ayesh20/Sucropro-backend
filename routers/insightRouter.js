import express from 'express';
import { generateAIInsights, getLatestInsight } from '../controllers/insightController.js';

const insightRouter = express.Router();

insightRouter.post('/generate', generateAIInsights);
insightRouter.get('/latest', getLatestInsight);

export default insightRouter;

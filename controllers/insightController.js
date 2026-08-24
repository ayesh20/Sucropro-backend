import { GoogleGenAI } from '@google/genai';
import Insight from '../models/insight.js';

export async function generateAIInsights(req, res) {
    try {
        const { summaryData } = req.body;

        if (!summaryData) {
            return res.status(400).json({ message: 'Summary data is required' });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ message: 'Gemini API Key is missing in the server configuration.' });
        }

        const ai = new GoogleGenAI({ apiKey });

        const prompt = `
You are an expert sugar industry analyst. Review the following weekly storage loss summary data for our sugar storage units.
Data:
${JSON.stringify(summaryData, null, 2)}

Based on this data, provide analytical insights and future strategic company decisions. Focus on:
1. Identifying which storage unit has the highest loss and why.
2. Recommendations on which unit to process/clear next.
3. Any temperature or humidity factors that might be contributing to the loss (if data shows it).
Keep your response professional, structured with bullet points, and concise.
`;

        const response = await ai.models.generateContent({
            model: 'gemini-3.5-flash',
            contents: prompt,
        });

        const insightContent = response.text;

        // Save to database
        const newInsight = new Insight({
            content: insightContent
        });
        await newInsight.save();

        return res.status(200).json({
            message: 'Insight generated successfully',
            data: newInsight
        });

    } catch (error) {
        console.error('Error generating AI insights:', error);
        return res.status(500).json({ message: error.message || 'Failed to generate insights' });
    }
}

export async function getLatestInsight(req, res) {
    try {
        const latestInsight = await Insight.findOne().sort({ createdAt: -1 });
        return res.status(200).json({
            data: latestInsight
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}



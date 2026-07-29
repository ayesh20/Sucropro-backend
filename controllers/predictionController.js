import axios from 'axios';
import Prediction from '../models/Prediction.js';
import StorageTrainingData from '../models/StorageTrainingData.js';
import Rendement from '../models/rendementcalc.js';
import Weight from '../models/weight.js';
import Batch from '../models/newbatch.js';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL;

export async function getBatchDataForPrediction(req, res) {
    try {
        const { batchId } = req.params;

        // Fetch from all 3 collections in parallel
        const [rendementRecord, weightRecord, batchRecord] = await Promise.all([
            Rendement.findOne({ BatchId: batchId }).sort({ date: -1 }),
            Weight.findOne({ BatchId: batchId }),
            Batch.findOne({ BatchId: batchId })
        ]);

        if (!rendementRecord) {
            return res.status(404).json({
                message: `No rendement calculation found for Batch ID: ${batchId}. Please run Sucrose Calculation first.`
            });
        }

        if (!weightRecord) {
            return res.status(404).json({
                message: `No weight record found for Batch ID: ${batchId}.`
            });
        }

        if (!batchRecord) {
            return res.status(404).json({
                message: `No batch found for Batch ID: ${batchId}.`
            });
        }

        return res.status(200).json({
            batchId,
            // From rendementcalc collection
            entryBrix: rendementRecord.Brix,
            entryPol: rendementRecord.Pol,
            entryPurity: rendementRecord.Purity,
            entryRendement: rendementRecord.Rendement,
            // From weight collection
            batchWeight: weightRecord.NetWeight,
            storageCompartment: weightRecord.StorageUnit || 'N/A',
            // From batches collection
            caneAge: parseInt(batchRecord.Caneage) || parseInt(weightRecord.CaneAge) || 0
        });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

export async function runPrediction(req, res) {
    try {
        const { batchId, durationDays, avgTemp, avgHumidity } = req.body;

        if (!batchId || !durationDays || avgTemp === undefined || avgHumidity === undefined) {
            return res.status(400).json({
                message: 'batchId, durationDays, avgTemp, and avgHumidity are required'
            });
        }

        if (![2, 3, 4].includes(Number(durationDays))) {
            return res.status(400).json({ message: 'durationDays must be 2, 3, or 4' });
        }

        const [rendementRecord, weightRecord, batchRecord] = await Promise.all([
            Rendement.findOne({ BatchId: batchId }).sort({ date: -1 }),
            Weight.findOne({ BatchId: batchId }),
            Batch.findOne({ BatchId: batchId })
        ]);

        if (!rendementRecord) {
            return res.status(404).json({
                message: `No rendement calculation found for Batch ID: ${batchId}`
            });
        }
        if (!weightRecord) {
            return res.status(404).json({
                message: `No weight record found for Batch ID: ${batchId}`
            });
        }
        if (!batchRecord) {
            return res.status(404).json({
                message: `Batch not found: ${batchId}`
            });
        }

        const caneAge = parseInt(batchRecord.Caneage) || parseInt(weightRecord.CaneAge) || 0;
        const batchWeight = weightRecord.NetWeight;
        const storageCompartment = weightRecord.StorageUnit || 'A';
        const entryBrix = rendementRecord.Brix;
        const entryPol = rendementRecord.Pol;
        const entryPurity = rendementRecord.Purity;
        const entryRendement = rendementRecord.Rendement;

        // Call Python ML service
        let mlResponse;
        try {
            mlResponse = await axios.post(`${ML_SERVICE_URL}/predict`, {
                duration_days: Number(durationDays),
                avg_temp: Number(avgTemp),
                avg_humidity: Number(avgHumidity),
                brix: entryBrix,
                pol: entryPol,
                purity: entryPurity,
                cane_age: caneAge,
                batch_weight: batchWeight
            }, { timeout: 10000 });
        } catch (mlError) {
            return res.status(503).json({
                message: 'ML prediction service is unavailable. Please try again later.',
                detail: mlError.message
            });
        }

        let { predicted_rendement, feature_importance } = mlResponse.data;

        if (predicted_rendement >= entryRendement) {
            let dailyLossFactor = 0.005;

            // Additional penalty for high temperature (above 30C)
            if (Number(avgTemp) > 30) dailyLossFactor += 0.002;

            // Additional penalty for high humidity (above 80%)
            if (Number(avgHumidity) > 80) dailyLossFactor += 0.002;

            const totalLossPercent = dailyLossFactor * Number(durationDays);
            predicted_rendement = entryRendement - (entryRendement * totalLossPercent);
        }

        // Calculate loss values
        const predictedLoss = parseFloat((entryRendement - predicted_rendement).toFixed(2));
        const sucroseLoss = parseFloat((batchWeight * (predictedLoss / 100)).toFixed(4));
        const predictedSucrose = parseFloat((batchWeight * (predicted_rendement / 100)).toFixed(4));
        const entrySucrose = parseFloat((batchWeight * (entryRendement / 100)).toFixed(4));

        // Save prediction to DB
        const prediction = new Prediction({
            batchId,
            storageCompartment,
            durationDays: Number(durationDays),
            avgTemp: Number(avgTemp),
            avgHumidity: Number(avgHumidity),
            entryBrix,
            entryPol,
            entryPurity,
            entryRendement,
            batchWeight,
            caneAge,
            predictedRendement: parseFloat(predicted_rendement.toFixed(2)),
            predictedLoss,
            sucroseLoss,
            predictedSucrose,
            entrySucrose,
            featureImportance: feature_importance || {}
        });

        await prediction.save();

        return res.status(201).json({
            message: 'Prediction completed successfully',
            data: {
                batchId,
                storageCompartment,
                durationDays: Number(durationDays),
                avgTemp: Number(avgTemp),
                avgHumidity: Number(avgHumidity),
                entryRendement,
                predictedRendement: parseFloat(predicted_rendement.toFixed(2)),
                predictedLoss,
                sucroseLoss,
                predictedSucrose,
                entrySucrose,
                batchWeight,
                featureImportance: feature_importance || {}
            }
        });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}


export async function getPredictionHistory(req, res) {
    try {
        const { compartment, from, to } = req.query;

        const filter = {};
        if (compartment) filter.storageCompartment = compartment.toUpperCase();
        if (from || to) {
            filter.createdAt = {};
            if (from) filter.createdAt.$gte = new Date(from);
            if (to) filter.createdAt.$lte = new Date(to);
        }

        const predictions = await Prediction.find(filter).sort({ createdAt: -1 });

        return res.status(200).json({
            count: predictions.length,
            data: predictions
        });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}


export async function getLossSummary(req, res) {
    try {
        // Filter to last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const weekFilter = { createdAt: { $gte: sevenDaysAgo } };

        const summary = await Prediction.aggregate([
            { $match: weekFilter },
            {
                $group: {
                    _id: '$storageCompartment',
                    totalBatches: { $sum: 1 },
                    totalBatchWeight: { $sum: '$batchWeight' },
                    totalSucroseLost: { $sum: '$sucroseLoss' },
                    totalSucroseUsed: { $sum: '$predictedSucrose' },
                    avgLossPercent: { $avg: '$predictedLoss' },
                    avgTemp: { $avg: '$avgTemp' },
                    avgHumidity: { $avg: '$avgHumidity' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        return res.status(200).json({
            compartmentSummary: summary,
            weekFrom: sevenDaysAgo
        });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

export async function getPredictionById(req, res) {
    try {
        const prediction = await Prediction.findById(req.params.id);
        if (!prediction) {
            return res.status(404).json({ message: 'Prediction not found' });
        }
        return res.status(200).json({ data: prediction });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

export async function exportTrainingData(req, res) {
    try {
        const data = await StorageTrainingData.find({}, { __v: 0, _id: 0 });
        return res.status(200).json({
            count: data.length,
            data
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

export async function addTrainingRecord(req, res) {
    try {
        const { durationDays, avgTemp, avgHumidity, brix, pol, purity, actualRendement } = req.body;

        const record = new StorageTrainingData({
            durationDays, avgTemp, avgHumidity,
            brix, pol, purity, actualRendement
        });

        await record.save();
        return res.status(201).json({ message: 'Training record added', data: record });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
}


export async function bulkAddTrainingData(req, res) {
    try {
        const data = req.body;

        if (!Array.isArray(data) || data.length === 0) {
            return res.status(400).json({ message: 'Request body must be a non-empty array' });
        }

        const inserted = await StorageTrainingData.insertMany(data);
        return res.status(201).json({
            message: `Successfully inserted ${inserted.length} training records`,
            count: inserted.length
        });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
}

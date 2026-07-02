import axios from 'axios';
import Prediction from '../models/Prediction.js';
import StorageTrainingData from '../models/StorageTrainingData.js';
import Rendement from '../models/rendementcalc.js';
import Weight from '../models/weight.js';
import Batch from '../models/newbatch.js';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

/* ─────────────────────────────────────────────────────────────
   GET /api/predictions/batch-data/:batchId
   Auto-fills the prediction form with data from 3 collections
───────────────────────────────────────────────────────────── */
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
            storageCompartment: weightRecord.StorageUnit || 'N/A',  // auto-filled A/B/C
            // From batches collection
            caneAge: parseInt(batchRecord.Caneage) || parseInt(weightRecord.CaneAge) || 0
        });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

/* ─────────────────────────────────────────────────────────────
   POST /api/predictions/run
   Main prediction endpoint — calls ML service, saves result
───────────────────────────────────────────────────────────── */
export async function runPrediction(req, res) {
    try {
        const { batchId, durationDays, avgTemp, avgHumidity } = req.body;

        // Validate required user inputs
        if (!batchId || !durationDays || avgTemp === undefined || avgHumidity === undefined) {
            return res.status(400).json({
                message: 'batchId, durationDays, avgTemp, and avgHumidity are required'
            });
        }

        if (![2, 3, 4].includes(Number(durationDays))) {
            return res.status(400).json({ message: 'durationDays must be 2, 3, or 4' });
        }

        // Fetch all batch data from DB
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

        // Build feature values
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

        const { predicted_rendement, feature_importance } = mlResponse.data;

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

/* ─────────────────────────────────────────────────────────────
   GET /api/predictions/history
   All past predictions — optional filter by compartment & date
───────────────────────────────────────────────────────────── */
export async function getPredictionHistory(req, res) {
    try {
        const { compartment, from, to } = req.query;

        const filter = {};
        if (compartment) filter.storageCompartment = compartment.toUpperCase();
        if (from || to) {
            filter.createdAt = {};
            if (from) filter.createdAt.$gte = new Date(from);
            if (to)   filter.createdAt.$lte = new Date(to);
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

/* ─────────────────────────────────────────────────────────────
   GET /api/predictions/summary
   Aggregate loss stats per compartment — for Loss Monitoring
───────────────────────────────────────────────────────────── */
export async function getLossSummary(req, res) {
    try {
        const summary = await Prediction.aggregate([
            {
                $group: {
                    _id: '$storageCompartment',
                    totalBatches: { $sum: 1 },
                    avgLossPercent: { $avg: '$predictedLoss' },
                    totalSucroseLost: { $sum: '$sucroseLoss' },
                    avgTemp: { $avg: '$avgTemp' },
                    avgHumidity: { $avg: '$avgHumidity' },
                    avgDuration: { $avg: '$durationDays' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Also aggregate by compartment + duration for the bar chart
        const byDuration = await Prediction.aggregate([
            {
                $group: {
                    _id: {
                        compartment: '$storageCompartment',
                        duration: '$durationDays'
                    },
                    avgLoss: { $avg: '$predictedLoss' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.compartment': 1, '_id.duration': 1 } }
        ]);

        return res.status(200).json({
            compartmentSummary: summary,
            durationBreakdown: byDuration
        });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

/* ─────────────────────────────────────────────────────────────
   GET /api/predictions/:id
   Single prediction detail by MongoDB _id
───────────────────────────────────────────────────────────── */
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

/* ─────────────────────────────────────────────────────────────
   GET /api/training-data/export
   Export all StorageTrainingData as JSON — used for Colab
───────────────────────────────────────────────────────────── */
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

/* ─────────────────────────────────────────────────────────────
   POST /api/training-data/add
   Add a single training record
───────────────────────────────────────────────────────────── */
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

/* ─────────────────────────────────────────────────────────────
   POST /api/training-data/bulk-add
   Insert ALL records at once via Postman (array of objects)
───────────────────────────────────────────────────────────── */
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

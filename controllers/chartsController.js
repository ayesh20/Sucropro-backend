import Batch from '../models/newbatch.js';
import Prediction from '../models/Prediction.js';
import Weight from '../models/weight.js';

/* ─────────────────────────────────────────────────────────
   1. Daily Registered Batches – last 30 days
      GET /api/charts/daily-batches
   ───────────────────────────────────────────────────────── */
export async function getDailyBatches(req, res) {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
        thirtyDaysAgo.setHours(0, 0, 0, 0);

        const result = await Batch.aggregate([
            { $match: { Date: { $gte: thirtyDaysAgo } } },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$Date' }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Fill missing days with 0
        const dataMap = {};
        result.forEach(r => { dataMap[r._id] = r.count; });

        const days = [];
        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = d.toISOString().slice(0, 10);
            days.push({
                date: key,
                label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                count: dataMap[key] || 0
            });
        }

        return res.status(200).json({ data: days });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}

/* ─────────────────────────────────────────────────────────
   2. Storage Units Performance (A, B, C) – all-time totals
      GET /api/charts/storage-performance
   ───────────────────────────────────────────────────────── */
export async function getStoragePerformance(req, res) {
    try {
        const summary = await Prediction.aggregate([
            {
                $group: {
                    _id: '$storageCompartment',
                    totalBatches: { $sum: 1 },
                    totalBatchWeight: { $sum: '$batchWeight' },
                    totalSucroseLost: { $sum: '$sucroseLoss' },
                    totalPredictedSucrose: { $sum: '$predictedSucrose' },
                    totalEntrySucrose: { $sum: '$entrySucrose' },
                    avgLossPercent: { $avg: '$predictedLoss' },
                    avgTemp: { $avg: '$avgTemp' },
                    avgHumidity: { $avg: '$avgHumidity' },
                    avgEntryRendement: { $avg: '$entryRendement' },
                    avgPredictedRendement: { $avg: '$predictedRendement' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Ensure A, B, C always present
        const units = ['Unit A', 'Unit B', 'Unit C'];
        const result = units.map(u => {
            const found = summary.find(s => s._id === u);
            return found
                ? { ...found, unit: u }
                : {
                    _id: u, unit: u,
                    totalBatches: 0, totalBatchWeight: 0,
                    totalSucroseLost: 0, totalPredictedSucrose: 0, totalEntrySucrose: 0,
                    avgLossPercent: 0, avgTemp: 0, avgHumidity: 0,
                    avgEntryRendement: 0, avgPredictedRendement: 0
                };
        });

        return res.status(200).json({ data: result });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}

/* ─────────────────────────────────────────────────────────
   3. Admin KPI Summary – totals across entire system
      GET /api/charts/kpi-summary
   ───────────────────────────────────────────────────────── */
export async function getKpiSummary(req, res) {
    try {
        const [batchCount, predCount, predAgg, weightAgg, recentBatches] = await Promise.all([
            Batch.countDocuments(),
            Prediction.countDocuments(),
            Prediction.aggregate([
                {
                    $group: {
                        _id: null,
                        totalSucroseLost: { $sum: '$sucroseLoss' },
                        totalBatchWeight: { $sum: '$batchWeight' },
                        avgLoss: { $avg: '$predictedLoss' },
                        avgEntryRendement: { $avg: '$entryRendement' },
                        avgPredictedRendement: { $avg: '$predictedRendement' }
                    }
                }
            ]),
            Weight.aggregate([
                { $group: { _id: '$StorageUnit', totalNetWeight: { $sum: '$NetWeight' }, batchCount: { $sum: 1 } } },
                { $sort: { _id: 1 } }
            ]),
            // Last 7 days batch registrations trend
            Batch.aggregate([
                {
                    $match: {
                        Date: {
                            $gte: (() => {
                                const d = new Date(); d.setDate(d.getDate() - 6); d.setHours(0,0,0,0); return d;
                            })()
                        }
                    }
                },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$Date' } },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ])
        ]);

        const agg = predAgg[0] || {
            totalSucroseLost: 0, totalBatchWeight: 0, avgLoss: 0,
            avgEntryRendement: 0, avgPredictedRendement: 0
        };

        // Weekly trend fill
        const weekMap = {};
        recentBatches.forEach(r => { weekMap[r._id] = r.count; });
        const weekTrend = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(); d.setDate(d.getDate() - i);
            const key = d.toISOString().slice(0, 10);
            weekTrend.push({
                label: d.toLocaleDateString('en-US', { weekday: 'short' }),
                count: weekMap[key] || 0
            });
        }

        return res.status(200).json({
            data: {
                totalBatches: batchCount,
                totalPredictions: predCount,
                totalSucroseLost: parseFloat((agg.totalSucroseLost || 0).toFixed(4)),
                totalBatchWeight: parseFloat((agg.totalBatchWeight || 0).toFixed(2)),
                avgLossPercent: parseFloat((agg.avgLoss || 0).toFixed(2)),
                avgEntryRendement: parseFloat((agg.avgEntryRendement || 0).toFixed(2)),
                avgPredictedRendement: parseFloat((agg.avgPredictedRendement || 0).toFixed(2)),
                weightByUnit: weightAgg,
                weekTrend
            }
        });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}

/* ─────────────────────────────────────────────────────────
   4. Rendement: Actual vs Predicted – last 15 predictions
      GET /api/charts/rendement-trend
   ───────────────────────────────────────────────────────── */
export async function getRendementTrend(req, res) {
    try {
        const predictions = await Prediction.find({}, {
            batchId: 1,
            entryRendement: 1,
            predictedRendement: 1,
            storageCompartment: 1,
            createdAt: 1
        }).sort({ createdAt: -1 }).limit(30);

        // Return in ascending order for chart left-to-right flow
        const data = predictions.reverse().map((p, i) => ({
            index: i + 1,
            label: p.batchId,
            actualRendement: parseFloat((p.entryRendement || 0).toFixed(2)),
            predictedRendement: parseFloat((p.predictedRendement || 0).toFixed(2)),
            unit: p.storageCompartment,
            date: p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''
        }));

        return res.status(200).json({ data, count: data.length });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}

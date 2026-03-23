import Calculation from "../models/calculation.js";


export async function addCalculations(req, res) {
    try {
        const data = req.body;
        if (!Array.isArray(data) || data.length === 0) {
            return res.status(400).json({ message: "Request body must be a non-empty array" });
        }
        const inserted = await Calculation.insertMany(data);
        res.status(201).json({
            message: `Successfully inserted ${inserted.length} records`,
            count: inserted.length
        });
    } catch (error) {
        res.status(500).json({ message: "Error inserting calculations", error: error.message });
    }
}


export async function clearCalculations(req, res) {
    try {
        const result = await Calculation.deleteMany({});
        res.json({ message: `Deleted ${result.deletedCount} records` });
    } catch (error) {
        res.status(500).json({ message: "Error clearing calculations", error: error.message });
    }
}

/* ── Get all calculations ── */
export async function getCalculations(req, res) {
    try {
        const calculations = await Calculation.find({}, { __v: 0 });
        res.json({
            count: calculations.length,
            calculations
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching calculations", error: error.message });
    }
}


import Batch from "../models/newbatch.js";

/* ── Create a new batch ── */
export async function createBatch(req, res) {
    try {
        const {
            BatchId,
            Date: date,
            FeildId,
            Vatiety,
            Weightwithvehicle,
            Caneage,
            VehicleNo,
            FarmerId,
            Unit
        } = req.body;

        const existing = await Batch.findOne({ BatchId });
        if (existing) {
            return res.status(400).json({ message: "Batch ID already exists" });
        }

        const batch = new Batch({
            BatchId,
            Date: date,
            FeildId,
            Vatiety,
            Weightwithvehicle,
            Caneage,
            VehicleNo,
            FarmerId,
            Unit
        });

        await batch.save();
        res.status(201).json({ message: "Batch created successfully", batch });
    } catch (error) {
        res.status(500).json({ message: "Error creating batch", error: error.message });
    }
}

/* ── Get all batches ── */
export async function getAllBatches(req, res) {
    try {
        const batches = await Batch.find({}, { __v: 0 }).sort({ Date: -1 });
        res.json({ count: batches.length, batches });
    } catch (error) {
        res.status(500).json({ message: "Error fetching batches", error: error.message });
    }
}

/* ── Get batch by BatchId (string) ── */
export async function getBatchByBatchId(req, res) {
    try {
        const batch = await Batch.findOne({ BatchId: req.params.batchId }, { __v: 0 });
        if (!batch) return res.status(404).json({ message: "Batch not found" });
        res.json(batch);
    } catch (error) {
        res.status(500).json({ message: "Error fetching batch", error: error.message });
    }
}

/* ── Get most-recent batch by FarmerId (string) ── */
export async function getBatchByFarmerId(req, res) {
    try {
        const batch = await Batch.findOne(
            { FarmerId: req.params.farmerId },
            { __v: 0 }
        ).sort({ Date: -1 });   // most recent first
        if (!batch) return res.status(404).json({ message: "No batch found for this Farmer ID" });
        res.json(batch);
    } catch (error) {
        res.status(500).json({ message: "Error fetching batch by Farmer ID", error: error.message });
    }
}

/* ── Add new vehicle data to existing batch ── */
export async function updateBatchWeight(req, res) {
    try {
        const { Weightwithvehicle, VehicleNo, Date } = req.body;
        if (!Weightwithvehicle || !VehicleNo) {
            return res.status(400).json({ message: "Weightwithvehicle and VehicleNo are required" });
        }

        const batch = await Batch.findOne({ BatchId: req.params.batchId });
        if (!batch) return res.status(404).json({ message: "Batch not found" });

        batch.Weightwithvehicle = parseFloat(Weightwithvehicle);
        batch.VehicleNo = VehicleNo;
        if (Date) batch.Date = Date;
        await batch.save();

        res.json({ message: "Batch delivery metadata updated successfully", batch });
    } catch (error) {
        res.status(500).json({ message: "Error updating batch delivery metadata", error: error.message });
    }
}

/* ── Get single batch by ID ── */
export async function getBatchById(req, res) {
    try {
        const batch = await Batch.findById(req.params.id, { __v: 0 });
        if (!batch) return res.status(404).json({ message: "Batch not found" });
        res.json(batch);
    } catch (error) {
        res.status(500).json({ message: "Error fetching batch", error: error.message });
    }
}

/* ── Delete batch ── */
export async function deleteBatch(req, res) {
    try {
        const deleted = await Batch.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: "Batch not found" });
        res.json({ message: "Batch deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting batch", error: error.message });
    }
}
import Weight from "../models/weight.js";

export async function createWeight(req, res) {
    try {
        const {
            BatchId,
            Date,
            VehicleNo,
            Weightwithvehicle,
            VehicleWeight,
            ActualSugarcaneWeight,
            FeildId,
            CaneAge,
            CaneVariety,
            StorageUnit,
        } = req.body;

        const weight = new Weight({
            BatchId,
            Date,
            VehicleNo,
            Weightwithvehicle,
            VehicleWeight,
            NetWeight: ActualSugarcaneWeight,
            FeildId:     FeildId    || "",
            CaneAge:     CaneAge    || "",
            CaneVariety: CaneVariety|| "",
            StorageUnit: StorageUnit|| "",
        });

        await weight.save();
        res.status(201).json({ message: "Weight created successfully", weight });

    } catch (error) {
        res.status(500).json({ message: "Error creating weight", error: error.message });
    }
}


export async function getAllWeights(req, res) {
    try {
        const weights = await Weight.find({}, { __v: 0 }).sort({ Date: -1 });
        res.json({ count: weights.length, weights });
    } catch (error) {
        res.status(500).json({ message: "Error fetching weights", error: error.message });
    }
}

export async function getWeightById(req, res) {
    try {
        const weight = await Weight.findOne({ BatchId: req.params.batchId }, { __v: 0 });
        if (!weight) return res.status(404).json({ message: "Weight not found" });
        res.json(weight);
    } catch (error) {
        res.status(500).json({ message: "Error fetching weight", error: error.message });
    }
}

export async function updateWeight(req, res) {
    try {
        const { BatchId, Date, VehicleNo, Weightwithvehicle, VehicleWeight, ActualSugarcaneWeight } = req.body;
        const weight = await Weight.findByIdAndUpdate(req.params.id, { BatchId, Date, VehicleNo, Weightwithvehicle, VehicleWeight, NetWeight: ActualSugarcaneWeight }, { new: true });
        if (!weight) return res.status(404).json({ message: "Weight not found" });
        res.json({ message: "Weight updated successfully", weight });
    } catch (error) {
        res.status(500).json({ message: "Error updating weight", error: error.message });
    }
}

export async function updateWeightDelivery(req, res) {
    try {
        const { Weightwithvehicle, VehicleNo, Date } = req.body;
        if (!Weightwithvehicle || !VehicleNo) {
            return res.status(400).json({ message: "Weightwithvehicle and VehicleNo are required" });
        }

        const weight = await Weight.findOne({ BatchId: req.params.batchId });
        if (!weight) return res.status(404).json({ message: "Weight document not found for this Batch" });

        weight.Weightwithvehicle = parseFloat(Weightwithvehicle);
        weight.VehicleNo = VehicleNo;
        if (Date) weight.Date = Date;
        await weight.save();

        res.json({ message: "Weight delivery data updated successfully", weight });
    } catch (error) {
        res.status(500).json({ message: "Error updating weight delivery data", error: error.message });
    }
}

import mongoose from "mongoose";

const weightSchema = new mongoose.Schema({
    BatchId: {
        type: String,
        required: true
    },
    FeildId: {
        type: String,
        required: false
    },
    CaneAge: {
        type: String,
        required: false
    },
    CaneVariety: {
        type: String,
        required: false
    },
    StorageUnit: {
        type: String,
        required: false
    },
    VehicleNo: {
        type: String,
        required: true
    },
    Weightwithvehicle: {
        type: Number,
        required: true
    },
    VehicleWeight: {
        type: Number,
        required: true
    },
    NetWeight: {
        type: Number,
        required: true
    },
    Date: {
        type: Date,
        required: true
    }
})

const Weight = mongoose.model("Weight", weightSchema);
export default Weight;
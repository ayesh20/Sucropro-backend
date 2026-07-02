import mongoose from 'mongoose';

const predictionSchema = new mongoose.Schema({
    // Batch identification
    batchId: {
        type: String,
        required: true
    },

    // Auto-filled from weight collection (StorageUnit field)
    storageCompartment: {
        type: String,
        required: true             // "A", "B", or "C" — from weight.StorageUnit
    },

    // Storage conditions (user enters manually)
    durationDays: {
        type: Number,
        required: true,
        enum: [2, 3, 4]
    },
    avgTemp: {
        type: Number,
        required: true
    },
    avgHumidity: {
        type: Number,
        required: true
    },

    // Auto-fetched from rendementcalc collection
    entryBrix: {
        type: Number,
        required: true
    },
    entryPol: {
        type: Number,
        required: true
    },
    entryPurity: {
        type: Number,
        required: true
    },
    entryRendement: {
        type: Number,
        required: true
    },

    // Auto-fetched from weight collection
    batchWeight: {
        type: Number,
        required: true             // NetWeight in tonnes
    },

    // Auto-fetched from batches collection
    caneAge: {
        type: Number,
        required: true
    },

    // ML model results
    predictedRendement: {
        type: Number,
        required: true
    },
    predictedLoss: {
        type: Number,
        required: true             // % = entryRendement - predictedRendement
    },
    sucroseLoss: {
        type: Number,
        required: true             // tonnes = batchWeight * (predictedLoss/100)
    },
    predictedSucrose: {
        type: Number,
        required: true             // tonnes = batchWeight * (predictedRendement/100)
    },
    entrySucrose: {
        type: Number,
        required: true             // tonnes = batchWeight * (entryRendement/100)
    },

    // Feature importance from ML model
    featureImportance: {
        type: Object,
        default: {}
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Prediction = mongoose.model('predictions', predictionSchema);

export default Prediction;

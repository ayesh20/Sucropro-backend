import mongoose from 'mongoose';

const storageTrainingDataSchema = new mongoose.Schema({
    // Storage conditions
    durationDays: {
        type: Number,
        required: true,
        enum: [2, 3, 4]            // only 2, 3 or 4 days
    },
    avgTemp: {
        type: Number,
        required: true             // midpoint of temp range: 24, 27, 30, 33, 36
    },
    avgHumidity: {
        type: Number,
        required: true             // midpoint of humidity range: 50, 70, 90
    },

    // Batch quality at entry
    brix: {
        type: Number,
        required: true
    },
    pol: {
        type: Number,
        required: true
    },
    purity: {
        type: Number,
        required: true
    },

    // Target variable — rendement AFTER storage (from your dataset "Ren" column)
    actualRendement: {
        type: Number,
        required: true
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

const StorageTrainingData = mongoose.model('storagetrainingdata', storageTrainingDataSchema);

export default StorageTrainingData;

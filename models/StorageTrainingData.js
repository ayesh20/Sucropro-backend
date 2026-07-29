import mongoose from 'mongoose';

const storageTrainingDataSchema = new mongoose.Schema({

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

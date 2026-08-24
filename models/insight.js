import mongoose from 'mongoose';

const insightSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Insight = mongoose.model("Insight", insightSchema);

export default Insight;

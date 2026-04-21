import mongoose from 'mongoose';

const rendementSchema = new mongoose.Schema({
    BatchId: {
        type: String,
        required: true
    },

    Brix: {
        type: Number,
        required: true
    },
    Pol: {
        type: Number,
        required: true
    },
    Purity: {
        type: Number,
        required: true
    },
    Rendement: {
        type: Number,
        required: true
    },
    Grade: {
        type: String,
        required: true
    },
    RealValue: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }

})

const Rendement = mongoose.model("rendement", rendementSchema)

export default Rendement;



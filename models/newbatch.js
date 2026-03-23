import mongoose from 'mongoose';

const batchSchema = new mongoose.Schema({
    BatchId : {
        type : String,
        required : true
    },
    
    Date : {
        type : Date,
        required : true
    },
    FeildId : {
        type : String,
        required : true
    },
    Vatiety : {
        type : String,
        required : true 
    },
    Weightwithvehicle : {
        type : Number,
        required : true
    },
    VehicleWeight : {
        type : Number,
        required : true
    },
    NetWeight : {
        type : Number,
        required : true
    },
    Caneage: {
        type : String,
        required : true
    },
    Note : {
        type : String,
        required : false
    },
    Unit : {
        type : String,
        required : true
    }
    
})

const Batch = mongoose.model("batches",batchSchema)

export default Batch;



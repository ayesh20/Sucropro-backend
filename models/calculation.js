import mongoose from 'mongoose';

const calcSchema = new mongoose.Schema({
    Brix : {
        type : String,
        required : true
    },
    
    Polariscope : {
        type : String,
        required : true
    },
    Value : {
        type : String,
        required : true
    }
    
})

const Calculation = mongoose.model("calculations",calcSchema)

export default Calculation;



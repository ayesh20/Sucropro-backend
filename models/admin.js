import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    Name : {
        type : String,
        required : true
    },
    
    email : {
        type : String,
        required : true,
        unique : true
    },
    password : {
        type : String,
        required : true
    },
    role :{
        type : String,
        default : "admin"
    }
    
})

const User = mongoose.model("users",userSchema)

export default User;



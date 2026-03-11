import express from "express"
import mongoose from "mongoose"
import bodyParser from "body-parser"
import adminRouter from "./routers/adminRouter.js"
import studentRouter from "./routers/studentRouter.js"
import attendenceRouter from "./routers/attendenceRouter.js"
import paymentRouter from "./routers/paymentRouter.js"
import jwt, { decode } from "jsonwebtoken";
import cors from "cors";
import dotenv from "dotenv"
dotenv.config()


const app = express()

app.use(cors());
app.use(bodyParser.json())

app.use(
    (req,res,next)=>{

        const value = req.header("Authorization")
        if(value != null){
        const token = value.replace("Bearer ","")
         jwt.verify(token,
            process.env.JWT_SECRET,
            (err,decoded) =>{

                if(decoded == null){
                    res.status(403).json({
                    message : "invalid user"
                })
                }else{
                    req.user = decoded
                    next()
                }
            }

         )
        }else{
        next()
        }
    }
)


const connectionString = process.env.MONGO_URI


mongoose.connect(connectionString).then(
    ()=>{
        console.log("Connected to database")
    }
).catch(
    ()=>{
        console.log("Failed to connect to the database")
    }
)




app.use("/api/admin", adminRouter)
app.use("/api/students", studentRouter)
app.use("/api/attendance", attendenceRouter)
app.use("/api/payments", paymentRouter)




app.listen(5000, 
   ()=>{
       console.log("server started")
   }
)

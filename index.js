import express from "express"
import mongoose from "mongoose"
import bodyParser from "body-parser"
import adminRouter from "./routers/adminRouter.js"
import calcRuter from "./routers/calcRouter.js"
import jwt from "jsonwebtoken"
import cors from "cors"
import dotenv from "dotenv"
dotenv.config()

const app = express()

app.use(cors())
app.use(bodyParser.json())

const PUBLIC_ROUTES = [
    "/api/admin/login",
    
]

app.use((req, res, next) => {
    // Allow public routes without a token
    if (PUBLIC_ROUTES.includes(req.path)) {
        return next()
    }

    const value = req.header("Authorization")

    if (value != null) {
        const token = value.replace("Bearer ", "")
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (!decoded) {
                return res.status(403).json({
                    message: "Invalid or expired token"
                })
            }
            req.user = decoded
            next()
        })
    } else {
        // No token provided for a protected route
        return res.status(401).json({
            message: "Authorization token required"
        })
    }
})

/* ── Database ── */
const connectionString = process.env.MONGO_URI

mongoose.connect(connectionString).then(() => {
    console.log("Connected to database")
}).catch((error) => {
    console.log("Failed to connect to the database")
    console.log(error)
})

/* ── Routes ── */
app.use("/api/admin", adminRouter)
app.use("/api/calc", calcRuter)

/* ── Server ── */
app.listen(process.env.PORT, () => {
    console.log("server started")
    console.log("port is " + process.env.PORT)
})
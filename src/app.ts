import express from "express";
import dotenv from "dotenv";
dotenv.config()

import cors from 'cors';
import { connectDB } from "./config/db.config";
import constants from "./api/v1/utils/constants";
import authRoutes from "./api/v1/routes/auth.routes";
import companyRoutes from "./api/v1/routes/company.routes";
import userRoutes from "./api/v1/routes/user.routes";

const app = express()
const mainPath = '/api/v1'
const port = constants.PORT || 5000;

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors())

app.get('/', (req, res) => {
    res.json({welcome: "Welcome to Pylott 🚀"});
});

app.use(`${mainPath}/auth`, authRoutes);
app.use(`${mainPath}/company`, companyRoutes);
app.use(`${mainPath}/user`, userRoutes);

const startDb = async (url: string) => {
    try {
        await connectDB(url);
        console.log('✅ Connected to Mongo')
        app.listen(port, () => {
            console.log(`Welcome to Pylott 🚀 connected to port ${port}`);
        })
    } catch (error) {
        console.log(error);
    }
}

startDb(process.env.DB_URL as string)

import express from 'express'
import mongoose from 'mongoose';
import 'dotenv/config'
import cors from 'cors'
import cookieParser from 'cookie-parser';
import errorHandler from './src/Middleware/errorHandler.js';

const app = express();

// CORS middleware 
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'], // Vite ports
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

//middleware
app.use(express.json()); // cette middleware JSON : req.body

//app.use((req, res, next) =>{
//console.log(`Req method is ${req.method} & Req URL is ${req.url}`);
//next();
//})
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

import planningRoutes from './src/Routes/planning.js'
import notificationRoutes from './src/Routes/notification.js';
import employeRoutes from './src/Routes/employe.js';
import authRoutes from './src/Routes/auth.js';
import busRoutes from './src/Routes/bus.js';
import ligneRoutes from './src/Routes/ligne.js';
import aiRoutes from './src/Routes/ai.js';
import statsRoutes from './src/routes/stats.js';


//routes
app.use('/notification', notificationRoutes);
app.use('/auth', authRoutes);
app.use('/employe', employeRoutes);
app.use('/planning', planningRoutes)
app.use('/ai', aiRoutes);
app.use('/bus', busRoutes);
app.use('/ligne', ligneRoutes);
app.use('/stats', statsRoutes);

//connect to database

mongoose.connect(process.env.CONNECTION_STRING
);

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error'));
db.once('open', function () {
  console.log("connected to database");
})
app.use(errorHandler);
//start server
app.listen(process.env.PORT, () => {
  console.log(`Example app listening on port ${process.env.PORT}`)
})


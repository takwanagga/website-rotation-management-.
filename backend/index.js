import express from 'express'
import mongoose from 'mongoose';
import 'dotenv/config'
import cors from 'cors'
const app = express();
//middleware
app.use(express.json()); // cette middleware JSON : req.body

//app.use((req, res, next) =>{
//console.log(`Req method is ${req.method} & Req URL is ${req.url}`);
  //next();
//})
app.use(express.urlencoded({ extended: true }));


import planningRoutes from './src/Routes/planning.js'
app.use('/planning', planningRoutes)

import employeRoutes from './src/Routes/employe.js';
import busRoutes from './src/Routes/bus.js';
import ligneRoutes from './src/Routes/ligne.js';
app.use('/employe', employeRoutes);
app.use('/bus', busRoutes);
app.use('/ligne', ligneRoutes);

app.use(cors());

mongoose.connect(process.env.CONNECTION_STRING
);

const db = mongoose.connection;
db.on('error' , console.error.bind(console, 'connection error'));
db.once('open' , function(){
    console.log("connected to database");
})

app.listen(process.env.PORT, () => {
  console.log(`Example app listening on port ${process.env.PORT}`)
})

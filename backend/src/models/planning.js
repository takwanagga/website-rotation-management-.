import mongoose from "mongoose";
const Planschema =new mongoose.Schema({
    date : Date,
    heuredebut : String,
    heurefin : String,
    ligne : {type: mongoose.Schema.Types.ObjectId, ref: 'Ligne', required: true},
    bus : {type: mongoose.Schema.Types.ObjectId, ref: 'Bus', required: true},
    employe : {type: mongoose.Schema.Types.ObjectId, ref: 'Employe', required: true},
})
const Planning = mongoose.model('Planning', Planschema)
export default Planning;
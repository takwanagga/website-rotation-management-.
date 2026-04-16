import mongoose from "mongoose";
const Planschema =new mongoose.Schema({
    date : { type: Date, required: true },
    heuredebut : { type: String, required: true },
    heurefin : { type: String, required: true },
    ligne : {type: mongoose.Schema.Types.ObjectId, ref: 'Ligne', required: true},
    bus : {type: mongoose.Schema.Types.ObjectId, ref: 'Bus', required: true},
    employe : {type: mongoose.Schema.Types.ObjectId, ref: 'Employe', required: true},
    receveur : {type: mongoose.Schema.Types.ObjectId, ref: 'Employe'},
    publie: { type: Boolean, default: false },
}, { timestamps: true })

Planschema.index({ date: 1, heuredebut: 1, employe: 1 });
Planschema.index({ date: 1, heuredebut: 1, bus: 1 });

const Planning = mongoose.model('Planning', Planschema)
export default Planning;
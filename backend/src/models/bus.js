import mongoose from 'mongoose';

const busSchema = new mongoose.Schema({
    model: { 
        type: String, 
        required: true, 
        trim: true 
    },
    matricule: { 
        type: String, 
        required: true, 
        unique: true, 
        trim: true 
    },
    status: { 
        type: String, 
        enum: ['actif', 'en maintenance', 'retiré'], 
        default: 'actif' 
    }
}, { timestamps: true });

const Bus = mongoose.model('Bus', busSchema);

export default Bus;
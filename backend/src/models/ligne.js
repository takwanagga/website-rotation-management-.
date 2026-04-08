import mongoose from 'mongoose';

const ligneSchema = new mongoose.Schema({
    libelle: { 
        type: String, 
        required: true, 
        unique: true, 
        trim: true 
    },
    debutDeLigne: { 
        type: String, 
        required: true, 
        trim: true 
    },
    finDeLigne: { 
        type: String, 
        required: true, 
        trim: true 
    },
    distance: { 
        type: Number, 
        required: true 
    },
    status: { 
        type: String, 
        enum: ['actif', 'inactif'], 
        default: 'actif' 
    }
}, { timestamps: true });

export default mongoose.model('Ligne', ligneSchema);
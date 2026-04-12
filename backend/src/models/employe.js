import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import validator from 'validator';

const employeSchema = new mongoose.Schema({
    nom: { 
        type: String, 
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 100
    },
    prenom: { 
        type: String, 
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 100
    },
    mecano: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 50,
    },
    localisation: {
        type: String,
        trim: true,
        maxlength: 200
    },                          
    email: { 
        type: String, 
        required: true, 
        unique: true,
        trim: true,
        lowercase: true,
        validate: {
            validator: validator.isEmail,
            message: props => `${props.value} n'est pas un email valide !`
        }
    },
    role: { 
        type: String,
        enum: ['chauffeur', 'receveur', 'admin'], 
        default: 'chauffeur' 
    },
    telephone: { 
        type: String,
        trim: true,
        default: '',
        validate: {
            validator: function(v) {
                return v === '' || /^\d{8}$/.test(v);
            },
            message: 'Le numéro de téléphone doit contenir exactement 8 chiffres.'
        }
    },
    MotDePasse: {
        type: String,
        required: true,
        
        select: false,//  jamais renvoyé par défaut dans les requêtes
    },
    statut: {
        type: String,
        enum: ["en congé", "actif", "inactif"],
        default: "actif"
    },
    age: {
        type: Number,
        min: 18,
        max: 65
    }
}, { timestamps: true });


//  Hacher mot de passe saisi/modifié
employeSchema.pre('save', async function() {
    if (!this.isModified('MotDePasse')) return;

    // Validation manuelle pour s'assurer que le mot de passe est fort
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!regex.test(this.MotDePasse)) {
        throw new Error(
            'Le mot de passe doit contenir au moins 8 caractères, ' +
            'une majuscule, une minuscule, un chiffre et un caractère spécial.'
        );
    }

    const salt = await bcrypt.genSalt(10);
    this.MotDePasse = await bcrypt.hash(this.MotDePasse, salt);
});

// Comparer le mot de passe saisi avec le hash
employeSchema.methods.comparePassword = async function(motDePasseCandidat) {
    return bcrypt.compare(motDePasseCandidat, this.MotDePasse);
};

//  Cacher le mot de passe dans toutes les réponses JSON
employeSchema.methods.toJSON = function() {
    const obj = this.toObject();
    delete obj.MotDePasse;
    return obj;
};
const Employe = mongoose.model('Employe', employeSchema);
export default Employe;
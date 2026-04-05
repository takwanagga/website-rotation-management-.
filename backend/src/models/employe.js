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
        enum: ['chauffeur', 'receveur','admin'], 
        default: 'chauffeur' 
    },
    telephone: { 
        type: String,
        trim: true,
        default: '', // ou laisser vide, mais assure la présence du champ
        validate: {
            validator: function(v) {
                // Accepte une chaîne vide ou exactement 8 chiffres
                return v === '' || /^\d{8}$/.test(v);
            },
            message: props => `Le numéro de téléphone doit contenir exactement 8 chiffres.`
        }
    },
    MotDePasse: {
        type: String,
        required: true,
        validate: {
            // Minimum 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre, 1 caractère spécial
            validator: function(v) {
                return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(v);
            },
            message: 'Le mot de passe doit contenir au moins 8 caractères, dont une majuscule, une minuscule, un chiffre et un caractère spécial.'
        }
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
}, { timestamps: true })


// 🔒 Retirer le mot de passe des réponses JSON
employeSchema.methods.toJSON = function() {
    const obj = this.toObject();
    delete obj.MotDePasse;
    return obj;
};

// 🔐 Comparer un mot de passe candidat avec le hash stocké
employeSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.MotDePasse);
};

// ✍️ Hacher le mot de passe avant la sauvegarde
// Hash password before save if modified
employeSchema.pre('save', async function() {
    if (!this.isModified('MotDePasse')) return;
    
    // Plus besoin de "next", la fonction async gère les erreurs et la suite automatiquement
    const salt = await bcrypt.genSalt(10);
    this.MotDePasse = await bcrypt.hash(this.MotDePasse, salt);
});

const Employe = mongoose.model('Employe', employeSchema);

export default Employe;
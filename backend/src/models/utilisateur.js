import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import validator from 'validator';
import crypto from 'crypto';
const utilisateurSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    prenom: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
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
      maxlength: 200,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: validator.isEmail,
        message: (props) => `${props.value} n'est pas un email valide !`,
      },
    },
    role: {
      type: String,
      enum: ['chauffeur', 'receveur', 'admin'],
      default: 'chauffeur',
    },
    telephone: {
      type: String,
      trim: true,
      default: '',
      validate: {
        validator: function (v) {
          return v === '' || /^\d{8}$/.test(v);
        },
        message: 'Le numéro de téléphone doit contenir exactement 8 chiffres.',
      },
    },
    MotDePasse: {
      type: String,
      required: true,
      select: false,
    },
    age: {
      type: Number,
      min: 18,
      max: 65,
    },
    resetPasswordToken:       { type: String,  select: false },
    resetPasswordExpires:     { type: Date,    select: false },
  },
  {
    timestamps: true,
    discriminatorKey: '__type',
    collection: 'employes',
  }
 
);

utilisateurSchema.pre('save', async function () {
  if (!this.isModified('MotDePasse')) return;

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

utilisateurSchema.methods.comparePassword = async function (motDePasseCandidat) {
  return bcrypt.compare(motDePasseCandidat, this.MotDePasse);
};

utilisateurSchema.methods.createResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
  return resetToken;
};
 
utilisateurSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.MotDePasse;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpires;
  return obj;
};

const Utilisateur = mongoose.model('Utilisateur', utilisateurSchema);
export default Utilisateur;
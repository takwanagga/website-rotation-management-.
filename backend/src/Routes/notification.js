import mongoose from "mongoose";
 
const NotificationSchema = new mongoose.Schema({
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    temps: {
        type: Date,
        default: Date.now
    },
    vue: {
        type: Boolean,
        default: false
    },
    supprime: {
        type: Boolean,
        default: false
    },
    destinataire: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employe',
        required: true
    }
}, {
    timestamps: true
});
 
NotificationSchema.methods.Estvue = function() {
    return this.vue;
};
 
NotificationSchema.methods.Estsupprimer = function() {
    return this.supprime;
};
 
const Notification = mongoose.model('Notification', NotificationSchema);
 
export default Notification;